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
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { 
                    Text(
                        "Mis Ahijados",
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
                    items(state.children) { childInfo ->
                        SponsoredChildCard(
                            childInfo = childInfo,
                            onClick = { onChildClick(childInfo.nino.idNino) }
                        )
                    }
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

@Composable
private fun SponsoredChildCard(
    childInfo: SponsoredChildInfo,
    onClick: () -> Unit
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
                    model = "https://ui-avatars.com/api/?name=${childInfo.nino.nombre}&size=128&background=7FD8BE&color=fff",
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
                    DeliveryStatusItem(entrega)
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

@Composable
private fun DeliveryStatusItem(entrega: Entrega) {
    val (icon, color, statusText) = when (entrega.estadoEntrega) {
        "Entregado" -> Triple(Icons.Default.CheckCircle, SuccessGreen, "Entregado")
        "En Proceso" -> Triple(Icons.Default.Info, WarningOrange, "En proceso")
        else -> Triple(Icons.Default.Info, MaterialTheme.colorScheme.onSurfaceVariant, "Pendiente")
    }
    
    Surface(
        color = color.copy(alpha = 0.1f),
        shape = MaterialTheme.shapes.small,
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = color,
                modifier = Modifier.size(20.dp)
            )
            
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(2.dp)
            ) {
                Text(
                    text = entrega.descripcionRegalo,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurface
                )
                
                Text(
                    text = "$statusText • ${entrega.fechaProgramada}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}
