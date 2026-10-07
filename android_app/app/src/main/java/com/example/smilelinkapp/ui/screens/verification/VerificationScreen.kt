package com.example.smilelinkapp.ui.screens.verification

import android.net.Uri
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import coil.compose.AsyncImage
import com.example.smilelinkapp.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VerificationScreen(
    onBackClick: () -> Unit,
    viewModel: VerificationViewModel = viewModel()
) {
    val context = LocalContext.current
    val uiState by viewModel.uiState.collectAsState()

    // Activity Result Launchers para seleccionar imágenes
    val ineLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        if (uri != null) viewModel.setIneUri(uri)
    }

    val rostroLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        if (uri != null) viewModel.setRostroUri(uri)
    }

    // Efecto para mostrar mensajes de éxito o error
    LaunchedEffect(uiState.successMessage, uiState.errorMessage) {
        uiState.successMessage?.let {
            Toast.makeText(context, it, Toast.LENGTH_LONG).show()
            viewModel.clearMessages()
        }
        uiState.errorMessage?.let {
            Toast.makeText(context, it, Toast.LENGTH_LONG).show()
            viewModel.clearMessages()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Verificación de Identidad") },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Volver"
                        )
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.refreshPadrinoStatus() }) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = "Actualizar estado"
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = MaterialTheme.colorScheme.onPrimary,
                    navigationIconContentColor = MaterialTheme.colorScheme.onPrimary,
                    actionIconContentColor = MaterialTheme.colorScheme.onPrimary
                )
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(rememberScrollState())
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            val padrino = uiState.padrino
            val estado = padrino?.estadoVerificacion ?: "No Enviado"
            val puedeApadrinar = padrino?.puedeApadrinar == true
            val motivo = padrino?.motivoRechazo

            // 1. Tarjeta Principal de Estado de Verificación
            StatusBanner(
                estado = estado,
                puedeApadrinar = puedeApadrinar,
                motivo = motivo
            )

            // 2. Sección informativa si aún no está aprobado
            if (!puedeApadrinar) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.Top,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Info,
                            contentDescription = null,
                            tint = OceanBlue,
                            modifier = Modifier.size(24.dp)
                        )
                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text(
                                text = "¿Por qué solicitamos tu identificación?",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold,
                                color = TextPrimary
                            )
                            Text(
                                text = "Para salvaguardar la seguridad de los niños en la fundación, requerimos validar que cada padrino sea una persona real mediante su identificación oficial y una selfie reciente.",
                                style = MaterialTheme.typography.bodySmall,
                                color = TextSecondary
                            )
                        }
                    }
                }
            }

            // 3. Subida de Credencial de Elector (INE)
            UploadPhotoCard(
                title = "Identificación Oficial (INE / IFE)",
                subtitle = "Fotografía clara por el frente de tu credencial",
                icon = Icons.Default.Person,
                selectedUri = uiState.ineUri,
                hasExistingPhoto = !padrino?.fotoInePath.isNullOrBlank(),
                onSelectClick = { ineLauncher.launch("image/*") }
            )

            // 4. Subida de Foto de Rostro (Selfie)
            UploadPhotoCard(
                title = "Fotografía de Rostro (Selfie)",
                subtitle = "Rostro descubierto, de frente y con buena iluminación",
                icon = Icons.Default.Person,
                selectedUri = uiState.rostroUri,
                hasExistingPhoto = !padrino?.fotoRostroPath.isNullOrBlank(),
                onSelectClick = { rostroLauncher.launch("image/*") }
            )

            // 5. Consejos para que la verificación sea aprobada rápidamente
            Card(
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                border = BorderStroke(1.dp, DividerGray),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = "Recomendaciones:",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    TipRow(text = "Asegúrate de que el texto de tu INE sea 100% legible y sin reflejos.")
                    TipRow(text = "Toma la foto del rostro sin lentes oscuros ni cubrebocas.")
                    TipRow(text = "Usa fotografías originales de tu cámara (las imágenes editadas con IA son detectadas y marcadas).")
                }
            }

            // 6. Botón de Acción para enviar a revisión
            val canSubmit = uiState.ineUri != null || uiState.rostroUri != null
            Button(
                onClick = { viewModel.uploadDocuments(context) },
                enabled = canSubmit && !uiState.isUploading,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(54.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = OceanBlue,
                    disabledContainerColor = OceanBlue.copy(alpha = 0.4f)
                )
            ) {
                if (uiState.isUploading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(24.dp),
                        color = Color.White,
                        strokeWidth = 2.5.dp
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Text("Subiendo y analizando imágenes...")
                } else {
                    Icon(
                        imageVector = Icons.Default.Send,
                        contentDescription = null,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = if (estado == "Requiere_Reintento" || estado == "Rechazado") "Reenviar Documentos a Revisión" else "Enviar Documentos a Revisión",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

@Composable
private fun StatusBanner(
    estado: String,
    puedeApadrinar: Boolean,
    motivo: String?
) {
    val (bgColor, borderColor, icon, title, desc) = when {
        puedeApadrinar || estado == "Aprobado" -> {
            Tuple5(
                SuccessGreen.copy(alpha = 0.12f),
                SuccessGreen,
                Icons.Default.Check,
                "Identidad Verificada",
                "¡Felicidades! Tu cuenta está aprobada. Tienes acceso completo para apadrinar niños y realizar entregas."
            )
        }
        estado == "Pendiente" -> {
            Tuple5(
                WarmYellow.copy(alpha = 0.2f),
                WarmYellowDark,
                Icons.Default.Info,
                "En Revisión Administrativa",
                "Tus fotografías están en proceso de validación. Nuestro equipo revisará la información en breve."
            )
        }
        estado == "Requiere_Reintento" -> {
            Tuple5(
                WarningOrange.copy(alpha = 0.15f),
                WarningOrange,
                Icons.Default.Warning,
                "Reintento Requerido",
                if (!motivo.isNullOrBlank()) "Indicación del administrador: \"$motivo\""
                else "Se requiere volver a subir una o ambas fotografías. Por favor tómala con mejor iluminación."
            )
        }
        estado == "Rechazado" -> {
            Tuple5(
                ErrorRed.copy(alpha = 0.12f),
                ErrorRed,
                Icons.Default.Close,
                "Verificación Denegada",
                if (!motivo.isNullOrBlank()) "Motivo: \"$motivo\""
                else "Tu solicitud fue rechazada. Puedes volver a subir una identificación válida para reconsideración."
            )
        }
        else -> {
            Tuple5(
                OceanBlue.copy(alpha = 0.10f),
                OceanBlue,
                Icons.Default.Lock,
                "Pendiente de Envío",
                "Aún no has enviado tus documentos. Sube tu INE y fotografía para comenzar a apadrinar."
            )
        }
    }

    Card(
        colors = CardDefaults.cardColors(containerColor = bgColor),
        border = BorderStroke(1.5.dp, borderColor),
        shape = RoundedCornerShape(16.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(18.dp),
            verticalAlignment = Alignment.Top,
            horizontalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(46.dp)
                    .clip(CircleShape)
                    .background(borderColor.copy(alpha = 0.2f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = borderColor,
                    modifier = Modifier.size(28.dp)
                )
            }

            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
                Text(
                    text = desc,
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextPrimary.copy(alpha = 0.85f)
                )
            }
        }
    }
}

@Composable
private fun UploadPhotoCard(
    title: String,
    subtitle: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    selectedUri: Uri?,
    hasExistingPhoto: Boolean,
    onSelectClick: () -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
        border = BorderStroke(1.dp, DividerGray),
        shape = RoundedCornerShape(14.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = OceanBlue,
                    modifier = Modifier.size(24.dp)
                )
                Column {
                    Text(
                        text = title,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = TextPrimary
                    )
                    Text(
                        text = subtitle,
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondary
                    )
                }
            }

            // Preview o Placeholder
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(150.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(BackgroundWhite)
                    .border(1.dp, DividerGray, RoundedCornerShape(10.dp)),
                contentAlignment = Alignment.Center
            ) {
                if (selectedUri != null) {
                    AsyncImage(
                        model = selectedUri,
                        contentDescription = title,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )
                } else if (hasExistingPhoto) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Check,
                            contentDescription = null,
                            tint = SuccessGreen,
                            modifier = Modifier.size(36.dp)
                        )
                        Text(
                            text = "Fotografía previamente cargada en el servidor",
                            style = MaterialTheme.typography.bodySmall,
                            color = SuccessGreen,
                            fontWeight = FontWeight.Medium
                        )
                    }
                } else {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Add,
                            contentDescription = null,
                            tint = TextSecondary,
                            modifier = Modifier.size(40.dp)
                        )
                        Text(
                            text = "Ninguna foto seleccionada",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextSecondary
                        )
                    }
                }
            }

            OutlinedButton(
                onClick = onSelectClick,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(8.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Edit,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(if (selectedUri != null) "Cambiar foto seleccionada" else "Seleccionar de la galería")
            }
        }
    }
}

@Composable
private fun TipRow(text: String) {
    Row(
        verticalAlignment = Alignment.Top,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Icon(
            imageVector = Icons.Default.Check,
            contentDescription = null,
            tint = MintGreenDark,
            modifier = Modifier.size(16.dp).padding(top = 2.dp)
        )
        Text(
            text = text,
            style = MaterialTheme.typography.bodySmall,
            color = TextSecondary
        )
    }
}

private data class Tuple5<A, B, C, D, E>(
    val a: A, val b: B, val c: C, val d: D, val e: E
)
