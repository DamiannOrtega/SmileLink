package com.example.smilelinkapp.ui.screens.mychildren

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Info
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
import com.example.smilelinkapp.ui.components.EmptyState
import com.example.smilelinkapp.ui.components.ErrorMessage
import com.example.smilelinkapp.ui.components.LoadingIndicator
import androidx.compose.ui.platform.LocalContext
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import com.example.smilelinkapp.ui.theme.SuccessGreen
import com.example.smilelinkapp.ui.theme.WarningOrange


@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MyChildrenScreen(
    onChildClick: (String) -> Unit,
    viewModel: MyChildrenViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current
    var selectedDeliveryId by remember { mutableStateOf<String?>(null) }
    var isUploading by remember { mutableStateOf(false) }
    var isRefreshing by remember { mutableStateOf(false) }

    // Stop refresh indicator once state changes from Loading
    LaunchedEffect(uiState) {
        if (uiState !is MyChildrenUiState.Loading) {
            isRefreshing = false
        }
    }

    
    val launcher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri ->
        val deliveryId = selectedDeliveryId
        if (uri != null && deliveryId != null) {
            isUploading = true
            viewModel.uploadEvidence(
                context = context,
                entregaId = deliveryId,
                uri = uri,
                onSuccess = {
                    isUploading = false
                    Toast.makeText(context, "Evidencia anexada correctamente", Toast.LENGTH_SHORT).show()
                },
                onError = { error ->
                    isUploading = false
                    Toast.makeText(context, "Error: $error", Toast.LENGTH_LONG).show()
                }
            )
        }
        selectedDeliveryId = null
    }

    if (isUploading) {
        AlertDialog(
            onDismissRequest = {},
            title = { Text("Subiendo evidencia") },
            text = {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(16.dp),
                    modifier = Modifier.fillMaxWidth().padding(8.dp)
                ) {
                    CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                    Text("Guardando archivo y metadatos...", style = MaterialTheme.typography.bodyMedium)
                }
            },
            confirmButton = {}
        )
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { 
                    Text(
                        "Mis Ahijados",
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
        PullToRefreshBox(
            isRefreshing = isRefreshing,
            onRefresh = {
                isRefreshing = true
                viewModel.loadSponsoredChildren()
            },
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when (val state = uiState) {
                is MyChildrenUiState.Loading -> {
                    LoadingIndicator()
                }
                
                is MyChildrenUiState.Success -> {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        items(state.children) { childInfo ->
                            SponsoredChildCard(
                                childInfo = childInfo,
                                onClick = { onChildClick(childInfo.nino.idNino) },
                                onUploadEvidence = { entrega ->
                                    selectedDeliveryId = entrega.idEntrega
                                    launcher.launch("image/*")
                                }
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
}

@Composable
private fun SponsoredChildCard(
    childInfo: SponsoredChildInfo,
    onClick: () -> Unit,
    onUploadEvidence: (Entrega) -> Unit
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
                val imageModel = remember(childInfo.nino.foto, childInfo.nino.nombre) {
                    val foto = childInfo.nino.foto
                    if (foto != null && foto.startsWith("data:image/")) {
                        try {
                            val base64Data = foto.substringAfter("base64,")
                            val decodedBytes = android.util.Base64.decode(base64Data, android.util.Base64.DEFAULT)
                            android.graphics.BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size)
                        } catch (e: Exception) {
                            "https://ui-avatars.com/api/?name=${childInfo.nino.nombre}&size=128&background=7FD8BE&color=fff"
                        }
                    } else {
                        foto ?: "https://ui-avatars.com/api/?name=${childInfo.nino.nombre}&size=128&background=7FD8BE&color=fff"
                    }
                }

                AsyncImage(
                    model = imageModel,
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
                        onUploadEvidence = onUploadEvidence
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

@Composable
private fun DeliveryStatusItem(
    entrega: Entrega,
    onUploadEvidence: (Entrega) -> Unit
) {
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
        Column(
            modifier = Modifier.padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
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
                
                if (entrega.mongoEvidenciaId.isNullOrBlank()) {
                    Button(
                        onClick = { onUploadEvidence(entrega) },
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Text("Anexar", style = MaterialTheme.typography.labelMedium)
                    }
                } else {
                    Surface(
                        color = SuccessGreen.copy(alpha = 0.2f),
                        shape = MaterialTheme.shapes.extraSmall
                    ) {
                        Text(
                            text = "Evidencia ✓",
                            color = SuccessGreen,
                            style = MaterialTheme.typography.labelMedium,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                }
            }
            
            // Photo preview if available in NoSQL metadata
            val photoUrl = remember(entrega.evidenciasNosql) {
                val firstPhoto = entrega.evidenciasNosql?.firstOrNull { it.tipo == "foto" }
                if (firstPhoto != null) {
                    val apiBase = com.example.smilelinkapp.config.AppConfig.BASE_URL
                    val serverBase = if (apiBase.endsWith("/api/")) apiBase.substringBefore("/api/") else "http://10.66.207.165:8000"
                    "${serverBase}/${firstPhoto.urlArchivo}"
                } else {
                    null
                }
            }
            
            if (photoUrl != null) {
                AsyncImage(
                    model = photoUrl,
                    contentDescription = "Evidencia de entrega",
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(140.dp)
                        .clip(MaterialTheme.shapes.small),
                    contentScale = ContentScale.Crop
                )
            }
        }
    }
}
