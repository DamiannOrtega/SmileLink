package com.example.smilelinkapp.ui.screens.mychildren

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.foundation.clickable
import androidx.compose.ui.window.Dialog
import androidx.compose.foundation.background
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import coil.compose.AsyncImage
import com.example.smilelinkapp.data.model.Entrega
import coil.compose.AsyncImage
import com.example.smilelinkapp.ui.components.EmptyState
import com.example.smilelinkapp.ui.components.ErrorMessage
import com.example.smilelinkapp.ui.components.LoadingIndicator
import com.example.smilelinkapp.ui.theme.SuccessGreen
import com.example.smilelinkapp.ui.theme.WarningOrange

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MyChildrenScreen(
    onChildClick: (String) -> Unit,
    viewModel: MyChildrenViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var showHistory by remember { mutableStateOf(false) }
    var selectedEvidenceUrl by remember { mutableStateOf<String?>(null) }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { 
                    Text(
                        if (showHistory) "Historial" else "Mis Ahijados",
                        style = MaterialTheme.typography.headlineSmall
                    ) 
                },
                actions = {
                    IconButton(onClick = { viewModel.loadSponsoredChildren() }) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = "Actualizar"
                        )
                    }
                    IconButton(onClick = { showHistory = !showHistory }) {
                        Icon(
                            imageVector = if (showHistory) Icons.Default.CheckCircle else Icons.Default.DateRange,
                            contentDescription = if (showHistory) "Ver Activos" else "Ver Historial"
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = MaterialTheme.colorScheme.onPrimary,
                    actionIconContentColor = MaterialTheme.colorScheme.onPrimary
                )
            )
        }
    ) { paddingValues ->
        when (val state = uiState) {
            is MyChildrenUiState.Loading -> {
                LoadingIndicator()
            }
            
            is MyChildrenUiState.Success -> {

                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    val listToShow = if (showHistory) state.history else state.children
                    
                    if (listToShow.isEmpty()) {
                        item {
                            EmptyState(
                                title = if (showHistory) "Sin historial" else "No tienes ahijados activos",
                                message = if (showHistory) "No hay apadrinamientos anteriores" else "Explora niños disponibles y comienza a apadrinar",
                                emoji = if (showHistory) "📜" else "💝"
                            )
                        }
                    } else {
                        items(listToShow) { childInfo ->
                            SponsoredChildCard(
                                childInfo = childInfo,
                                onClick = { 
                                    if (!showHistory) {
                                        onChildClick(childInfo.nino.idNino) 
                                    }
                                },
                                isHistory = showHistory,
                                onEvidenceClick = { url -> selectedEvidenceUrl = url }
                            )
                        }
                    }
                }

                if (selectedEvidenceUrl != null) {
                    EvidenceDialog(url = selectedEvidenceUrl!!, onDismiss = { selectedEvidenceUrl = null })
                }
            }
            
            is MyChildrenUiState.Empty -> {
                EmptyState(
                    title = "No tienes ahijados aún",
                    message = "Explora niños disponibles y comienza a apadrinar",
                    emoji = "💝"
                )
            }
            
            is MyChildrenUiState.Error -> {
                ErrorMessage(
                    message = state.message,
                    onRetry = { viewModel.loadSponsoredChildren() }
                )
            }
        }
    }
}

// Helper to resolve avatar URL
private fun resolveAvatarUrl(url: String?, childName: String): String {
    if (url.isNullOrEmpty()) {
        val encodedName = java.net.URLEncoder.encode(childName, "UTF-8")
        return "https://ui-avatars.com/api/?name=$encodedName&size=512&background=7FD8BE&color=fff"
    }
    
    // Replace localhost or 127.0.0.1 with the backend IP accessible from Android
    var resolvedUrl = url
    if (url.contains("localhost") || url.contains("127.0.0.1")) {
        resolvedUrl = url.replace("localhost", "192.168.193.177")
                         .replace("127.0.0.1", "192.168.193.177")
    }
    
    // If it's a relative path (e.g. /media/...), append base URL
    if (resolvedUrl.startsWith("/")) {
        resolvedUrl = "http://192.168.193.177:8000$resolvedUrl"
    } else if (!resolvedUrl.startsWith("http")) {
         // Assume relative if not starting with http
         resolvedUrl = "http://192.168.193.177:8000/$resolvedUrl"
    }
    
    return resolvedUrl
}

@Composable
private fun SponsoredChildCard(
    childInfo: SponsoredChildInfo,
    onClick: () -> Unit,
    isHistory: Boolean = false,
    onEvidenceClick: (String) -> Unit = {}
) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Header with photo and name
            Row(
                horizontalArrangement = Arrangement.spacedBy(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                AsyncImage(
                    model = resolveAvatarUrl(childInfo.nino.avatarUrl, childInfo.nino.nombre),
                    contentDescription = "Foto de ${childInfo.nino.nombre}",
                    modifier = Modifier
                        .size(64.dp)
                        .clip(CircleShape),
                    contentScale = ContentScale.Crop
                )
                
                Column(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Text(
                        text = childInfo.nino.nombre,
                        style = MaterialTheme.typography.titleLarge,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    
                    Text(
                        text = "Apadrinado desde ${childInfo.apadrinamiento.fechaInicio}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            
            Divider()
            
            // Delivery status
            if (childInfo.entregas.isNotEmpty()) {
                Text(
                    text = "Entregas",
                    style = MaterialTheme.typography.titleSmall,
                    color = MaterialTheme.colorScheme.onSurface
                )
                
                childInfo.entregas.forEach { entrega ->
                    DeliveryStatusItem(
                        entrega = entrega,
                        onEvidenceClick = {
                            if (entrega.evidenciaFotoPath != null) {
                                onEvidenceClick(entrega.evidenciaFotoPath)
                            }
                        }
                    )
                }
            } else {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.Add,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(20.dp)
                    )
                    Text(
                        text = "No hay entregas registradas",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}


