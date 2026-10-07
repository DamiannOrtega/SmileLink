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

            // Banner de Identidad si no está aprobado
            if (!puedeApadrinar) {
                Surface(
                    onClick = onVerificationClick,
                    shape = androidx.compose.foundation.shape.RoundedCornerShape(10.dp),
                    color = when (estadoVerificacion) {
                        "Pendiente" -> com.example.smilelinkapp.ui.theme.WarmYellow.copy(alpha = 0.25f)
                        "Requiere_Reintento" -> com.example.smilelinkapp.ui.theme.WarningOrange.copy(alpha = 0.2f)
                        "Rechazado" -> com.example.smilelinkapp.ui.theme.ErrorRed.copy(alpha = 0.15f)
                        else -> com.example.smilelinkapp.ui.theme.OceanBlue.copy(alpha = 0.12f)
                    },
                    border = androidx.compose.foundation.BorderStroke(
                        1.dp,
                        when (estadoVerificacion) {
                            "Pendiente" -> com.example.smilelinkapp.ui.theme.WarmYellowDark
                            "Requiere_Reintento" -> com.example.smilelinkapp.ui.theme.WarningOrange
                            "Rechazado" -> com.example.smilelinkapp.ui.theme.ErrorRed
                            else -> com.example.smilelinkapp.ui.theme.OceanBlue
                        }
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp)
                        .padding(bottom = 12.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Icon(
                            imageVector = when (estadoVerificacion) {
                                "Pendiente" -> Icons.Default.Info
                                "Requiere_Reintento" -> Icons.Default.Warning
                                "Rechazado" -> Icons.Default.Close
                                else -> Icons.Default.Lock
                            },
                            contentDescription = null,
                            tint = when (estadoVerificacion) {
                                "Pendiente" -> com.example.smilelinkapp.ui.theme.WarmYellowDark
                                "Requiere_Reintento" -> com.example.smilelinkapp.ui.theme.WarningOrange
                                "Rechazado" -> com.example.smilelinkapp.ui.theme.ErrorRed
                                else -> com.example.smilelinkapp.ui.theme.OceanBlue
                            },
                            modifier = Modifier.size(20.dp)
                        )
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = when (estadoVerificacion) {
                                    "Pendiente" -> "Documentos en revisión por administración"
                                    "Requiere_Reintento" -> "Se solicitó reintento de identificación"
                                    "Rechazado" -> "Verificación de identidad denegada"
                                    else -> "Verifica tu identidad para poder apadrinar"
                                },
                                style = MaterialTheme.typography.bodySmall,
                                fontWeight = androidx.compose.ui.text.font.FontWeight.SemiBold,
                                color = com.example.smilelinkapp.ui.theme.TextPrimary
                            )
                            Text(
                                text = "Toca aquí para revisar tus documentos →",
                                style = MaterialTheme.typography.labelSmall,
                                color = com.example.smilelinkapp.ui.theme.TextSecondary
                            )
                        }
                    }
                }
            }

            // Filters Row
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
