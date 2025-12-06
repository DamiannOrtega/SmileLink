package com.example.smilelinkapp.ui.screens.deliveries

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Place
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.smilelinkapp.data.model.Apadrinamiento

/**
 * Deliveries Screen - Shows active sponsorships with delivery locations
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DeliveriesScreen(
    viewModel: DeliveriesViewModel = viewModel()
) {
    val context = LocalContext.current
    val uiState by viewModel.uiState.collectAsState()
    var expandedCardId by remember { mutableStateOf<String?>(null) }
    
    // Load deliveries on first composition
    LaunchedEffect(Unit) {
        viewModel.loadDeliveries(context)
    }
    
    // Show success message
    LaunchedEffect(uiState.deliverySuccess) {
        if (uiState.deliverySuccess) {
            viewModel.clearDeliverySuccess()
        }
    }
    
    // Show error snackbar
    val snackbarHostState = remember { SnackbarHostState() }
    LaunchedEffect(uiState.error) {
        uiState.error?.let { error ->
            snackbarHostState.showSnackbar(error)
            viewModel.clearError()
        }
    }
    
    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            TopAppBar(
                title = { 
                    Text(
                        "Entregas",
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.Bold
                    ) 
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when {
                uiState.isLoading -> {
                    // Loading state
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator()
                    }
                }
                
                uiState.apadrinamientos.isEmpty() -> {
                    // Empty state
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center,
                            modifier = Modifier.padding(32.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.ShoppingCart,
                                contentDescription = null,
                                modifier = Modifier.size(80.dp),
                                tint = MaterialTheme.colorScheme.primary.copy(alpha = 0.5f)
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Text(
                                text = "No hay entregas pendientes",
                                style = MaterialTheme.typography.titleLarge,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "Las asignaciones con ubicación de entrega aparecerán aquí",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f)
                            )
                        }
                    }
                }
                
                else -> {
                    // Content
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        item {
                            Text(
                                text = "${uiState.apadrinamientos.size} entrega(s) pendiente(s)",
                                style = MaterialTheme.typography.titleMedium,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
                                modifier = Modifier.padding(bottom = 8.dp)
                            )
                        }
                        
                        items(uiState.apadrinamientos) { apadrinamiento ->
                            DeliveryCard(
                                apadrinamiento = apadrinamiento,
                                nino = uiState.ninosMap[apadrinamiento.idNino],
                                puntoEntrega = apadrinamiento.idPuntoEntrega?.let { 
                                    uiState.puntosEntregaMap[it] 
                                },
                                isExpanded = expandedCardId == apadrinamiento.idApadrinamiento,
                                onExpandToggle = {
                                    expandedCardId = if (expandedCardId == apadrinamiento.idApadrinamiento) {
                                        null
                                    } else {
                                        apadrinamiento.idApadrinamiento
                                    }
                                },
                                onDeliverClick = {
                                    viewModel.markAsDelivered(apadrinamiento.idApadrinamiento)
                                },
                                onOpenMap = { lat, lng ->
                                    val uri = "geo:$lat,$lng?q=$lat,$lng"
                                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(uri))
                                    context.startActivity(intent)
                                },
                                isUpdating = uiState.isUpdating
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun DeliveryCard(
    apadrinamiento: Apadrinamiento,
    nino: com.example.smilelinkapp.data.model.Nino?,
    puntoEntrega: com.example.smilelinkapp.data.model.PuntoEntrega?,
    isExpanded: Boolean,
    onExpandToggle: () -> Unit,
    onDeliverClick: () -> Unit,
    onOpenMap: (Double, Double) -> Unit,
    isUpdating: Boolean
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onExpandToggle),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.weight(1f)
                ) {
                    Icon(
                        imageVector = Icons.Default.Person,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = nino?.nombre ?: "Cargando...",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                }
                
                Icon(
                    imageVector = if (isExpanded) Icons.Default.KeyboardArrowUp else Icons.Default.KeyboardArrowDown,
                    contentDescription = if (isExpanded) "Contraer" else "Expandir",
                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            // Location preview
            if (puntoEntrega != null) {
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.Place,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.secondary,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = puntoEntrega.nombrePunto,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            
            // Expanded content
            if (isExpanded) {
                Spacer(modifier = Modifier.height(16.dp))
                HorizontalDivider()
                Spacer(modifier = Modifier.height(16.dp))
                
                // Child info
                if (nino != null) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(MaterialTheme.colorScheme.surface)
                            .padding(12.dp)
                    ) {
                        Text(
                            text = "Información del Ahijado",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        InfoRow(label = "Nombre", value = nino.nombre)
                        InfoRow(label = "Edad", value = "${nino.edad} años")
                        InfoRow(label = "Género", value = nino.genero)
                        
                        if (nino.necesidades.isNotEmpty()) {
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "Regalos a entregar:",
                                style = MaterialTheme.typography.bodySmall,
                                fontWeight = FontWeight.Bold
                            )
                            nino.necesidades.forEach { necesidad ->
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.padding(vertical = 2.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.ShoppingCart,
                                        contentDescription = null,
                                        modifier = Modifier.size(16.dp),
                                        tint = MaterialTheme.colorScheme.primary
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        text = necesidad,
                                        style = MaterialTheme.typography.bodyMedium
                                    )
                                }
                            }
                        }
                    }
                }
                
                // Delivery location
                if (puntoEntrega != null) {
                    Spacer(modifier = Modifier.height(12.dp))
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(MaterialTheme.colorScheme.surface)
                            .padding(12.dp)
                    ) {
                        Text(
                            text = "Ubicación de Entrega",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        InfoRow(label = "Punto", value = puntoEntrega.nombrePunto)
                        InfoRow(label = "Dirección", value = puntoEntrega.direccionFisica)
                        puntoEntrega.horarioAtencion?.let {
                            InfoRow(label = "Horario", value = it)
                        }
                        puntoEntrega.contactoReferencia?.let {
                            InfoRow(label = "Contacto", value = it)
                        }
                        
                        Spacer(modifier = Modifier.height(12.dp))
                        
                        // Open in Maps button
                        Button(
                            onClick = { 
                                onOpenMap(puntoEntrega.latitud, puntoEntrega.longitud)
                            },
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = MaterialTheme.colorScheme.secondary
                            )
                        ) {
                            Icon(
                                imageVector = Icons.Default.LocationOn,
                                contentDescription = null,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Ver en Mapa")
                        }
                    }
                }
                
                // Deliver button
                Spacer(modifier = Modifier.height(16.dp))
                Button(
                    onClick = onDeliverClick,
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !isUpdating,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.primary
                    )
                ) {
                    if (isUpdating) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            color = MaterialTheme.colorScheme.onPrimary,
                            strokeWidth = 2.dp
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Procesando...")
                    } else {
                        Icon(
                            imageVector = Icons.Default.CheckCircle,
                            contentDescription = null,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Entregar Regalo")
                    }
                }
            }
        }
    }
}

@Composable
fun InfoRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 2.dp)
    ) {
        Text(
            text = "$label: ",
            style = MaterialTheme.typography.bodySmall,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurface
        )
    }
}

