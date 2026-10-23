package com.example.smilelinkapp.ui.screens.home

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.smilelinkapp.ui.components.ChildCard
import com.example.smilelinkapp.ui.components.EmptyState
import com.example.smilelinkapp.ui.components.ErrorMessage
import com.example.smilelinkapp.ui.components.LoadingIndicator

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    onChildClick: (String) -> Unit,
    onVerificationClick: () -> Unit = {},
    viewModel: HomeViewModel = viewModel()
) {
    val context = androidx.compose.ui.platform.LocalContext.current
    val sessionManager = remember { com.example.smilelinkapp.data.local.SessionManager(context) }
    val padrino = sessionManager.getPadrino()
    val estadoVerificacion = padrino?.estadoVerificacion ?: "No Enviado"
    val puedeApadrinar = padrino?.puedeApadrinar == true

    val uiState by viewModel.uiState.collectAsState()
    val searchQuery by viewModel.searchQuery.collectAsState()
    var isRefreshing by remember { mutableStateOf(false) }

    // Stop refresh indicator once state changes from Loading
    LaunchedEffect(uiState) {
        if (uiState !is HomeUiState.Loading) {
            isRefreshing = false
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        "Descubre Niños",
                        style = MaterialTheme.typography.headlineSmall
                    )
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = MaterialTheme.colorScheme.onPrimary
                )
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Search bar
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { viewModel.updateSearchQuery(it) },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                placeholder = { Text("Buscar por nombre o necesidad...") },
                leadingIcon = {
                    Icon(
                        imageVector = Icons.Default.Search,
                        contentDescription = "Buscar"
                    )
                },
                singleLine = true,
                shape = MaterialTheme.shapes.medium
            )

            // Si no está aprobado para apadrinar, mostrar pantalla de bloqueo
            if (!puedeApadrinar) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(24.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(16.dp),
                        modifier = Modifier.padding(horizontal = 16.dp)
                    ) {
                        Surface(
                            shape = androidx.compose.foundation.shape.CircleShape,
                            color = when (estadoVerificacion) {
                                "Rechazado" -> com.example.smilelinkapp.ui.theme.ErrorRed.copy(alpha = 0.15f)
                                "Pendiente" -> com.example.smilelinkapp.ui.theme.WarmYellow.copy(alpha = 0.2f)
                                "Requiere_Reintento" -> com.example.smilelinkapp.ui.theme.WarningOrange.copy(alpha = 0.15f)
                                else -> com.example.smilelinkapp.ui.theme.OceanBlue.copy(alpha = 0.12f)
                            },
                            modifier = Modifier.size(80.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    imageVector = when (estadoVerificacion) {
                                        "Rechazado" -> Icons.Default.Close
                                        "Pendiente" -> Icons.Default.Info
                                        "Requiere_Reintento" -> Icons.Default.Warning
                                        else -> Icons.Default.Lock
                                    },
                                    contentDescription = null,
                                    tint = when (estadoVerificacion) {
                                        "Rechazado" -> com.example.smilelinkapp.ui.theme.ErrorRed
                                        "Pendiente" -> com.example.smilelinkapp.ui.theme.WarmYellowDark
                                        "Requiere_Reintento" -> com.example.smilelinkapp.ui.theme.WarningOrange
                                        else -> com.example.smilelinkapp.ui.theme.OceanBlue
                                    },
                                    modifier = Modifier.size(40.dp)
                                )
                            }
                        }

                        Text(
                            text = when (estadoVerificacion) {
                                "Rechazado" -> "Verificación Denegada"
                                "Pendiente" -> "Documentos en Revisión"
                                "Requiere_Reintento" -> "Reintento Requerido"
                                else -> "Identidad Requerida"
                            },
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = androidx.compose.ui.text.font.FontWeight.Bold,
                            color = com.example.smilelinkapp.ui.theme.TextPrimary
                        )

                        Text(
                            text = when (estadoVerificacion) {
                                "Rechazado" -> "Tu solicitud de verificación fue rechazada por la administración. No tienes autorización para consultar la lista de niños ni apadrinar."
                                "Pendiente" -> "Tus fotografías están siendo revisadas por el administrador. En cuanto sean aprobadas, podrás ver la lista de niños disponibles."
                                "Requiere_Reintento" -> "El administrador solicitó que vuelvas a subir tus documentos de verificación para habilitar el acceso."
                                else -> "Por seguridad y protección de los niños, debes verificar tu identidad antes de poder consultar la lista de niños disponibles."
                            },
                            style = MaterialTheme.typography.bodyMedium,
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                            color = com.example.smilelinkapp.ui.theme.TextSecondary
                        )

                        Button(
                            onClick = onVerificationClick,
                            shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (estadoVerificacion == "Rechazado") com.example.smilelinkapp.ui.theme.ErrorRed else com.example.smilelinkapp.ui.theme.OceanBlue
                            )
                        ) {
                            Text(if (estadoVerificacion == "Rechazado") "Ver detalles del rechazo" else "Verificar mi identidad")
                        }
                    }
                }
            } else {
                // Filters Row (Solo para padrinos aprobados)
                val genderFilter by viewModel.genderFilter.collectAsState()
                val sortBy by viewModel.sortBy.collectAsState()
                var genderMenuExpanded by remember { mutableStateOf(false) }
                var sortMenuExpanded by remember { mutableStateOf(false) }

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp)
                        .padding(bottom = 12.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // Gender Filter Box
                    Box(modifier = Modifier.weight(1f)) {
                        OutlinedButton(
                            onClick = { genderMenuExpanded = true },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("Género: $genderFilter")
                        }
                        DropdownMenu(
                            expanded = genderMenuExpanded,
                            onDismissRequest = { genderMenuExpanded = false }
                        ) {
                            listOf("Todos", "Masculino", "Femenino").forEach { option ->
                                DropdownMenuItem(
                                    text = { Text(option) },
                                    onClick = {
                                        viewModel.updateGenderFilter(option)
                                        genderMenuExpanded = false
                                    }
                                )
                            }
                        }
                    }

                    // Sort By Box
                    Box(modifier = Modifier.weight(1f)) {
                        OutlinedButton(
                            onClick = { sortMenuExpanded = true },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("Orden: $sortBy")
                        }
                        DropdownMenu(
                            expanded = sortMenuExpanded,
                            onDismissRequest = { sortMenuExpanded = false }
                        ) {
                            listOf("Nombre", "Nombre (Z-A)", "Edad (Menor)", "Edad (Mayor)").forEach { option ->
                                DropdownMenuItem(
                                    text = { Text(option) },
                                    onClick = {
                                        viewModel.updateSortBy(option)
                                        sortMenuExpanded = false
                                    }
                                )
                            }
                        }
                    }
                }

                // Content with Pull-to-Refresh
                PullToRefreshBox(
                    isRefreshing = isRefreshing,
                    onRefresh = {
                        isRefreshing = true
                        viewModel.loadAvailableChildren()
                    },
                    modifier = Modifier.fillMaxSize()
                ) {
                    when (val state = uiState) {
                        is HomeUiState.Loading -> {
                            LoadingIndicator()
                        }

                        is HomeUiState.Success -> {
                            val filteredNinos = viewModel.getFilteredChildren(state.ninos)

                            if (filteredNinos.isEmpty()) {
                                EmptyState(
                                    title = "No se encontraron niños",
                                    message = "Intenta con otra búsqueda",
                                    emoji = "🔍"
                                )
                            } else {
                                LazyColumn(
                                    modifier = Modifier.fillMaxSize(),
                                    contentPadding = PaddingValues(16.dp),
                                    verticalArrangement = Arrangement.spacedBy(16.dp)
                                ) {
                                    items(filteredNinos) { nino ->
                                        ChildCard(
                                            nino = nino,
                                            onClick = { onChildClick(nino.idNino) }
                                        )
                                    }
                                }
                            }
                        }

                        is HomeUiState.Error -> {
                            ErrorMessage(
                                message = state.message,
                                onRetry = { viewModel.loadAvailableChildren() }
                            )
                        }
                    }
                }
            }
        }
    }
}
