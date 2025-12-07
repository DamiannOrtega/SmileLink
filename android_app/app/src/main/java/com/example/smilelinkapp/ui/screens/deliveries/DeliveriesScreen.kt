package com.example.smilelinkapp.ui.screens.deliveries

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.net.Uri
import android.preference.PreferenceManager
import android.util.Log
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.lifecycle.viewmodel.compose.viewModel
import coil.compose.AsyncImage
import androidx.compose.ui.layout.ContentScale
import com.example.smilelinkapp.data.model.Apadrinamiento
import com.google.android.gms.location.LocationServices
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.osmdroid.config.Configuration
import org.osmdroid.tileprovider.tilesource.TileSourceFactory
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.MapView
import org.osmdroid.views.overlay.Marker
import org.osmdroid.views.overlay.Polyline
import java.net.HttpURLConnection
import java.net.URL
import org.json.JSONObject

private const val TAG = "DeliveriesScreen"

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DeliveriesScreen(
    viewModel: DeliveriesViewModel = viewModel()
) {
    val context = LocalContext.current
    val uiState by viewModel.uiState.collectAsState()
    var expandedCardId by remember { mutableStateOf<String?>(null) }
    var showConfirmDialog by remember { mutableStateOf<String?>(null) }
    var showSuccessDialog by remember { mutableStateOf(false) }
    
    LaunchedEffect(Unit) {
        Configuration.getInstance().load(context, PreferenceManager.getDefaultSharedPreferences(context))
        viewModel.loadDeliveries(context)
    }
    
    LaunchedEffect(uiState.deliverySuccess) {
        if (uiState.deliverySuccess) {
            showSuccessDialog = true
            viewModel.clearDeliverySuccess()
        }
    }
    
    val snackbarHostState = remember { SnackbarHostState() }
    LaunchedEffect(uiState.error) {
        uiState.error?.let { error ->
            snackbarHostState.showSnackbar(error)
            viewModel.clearError()
        }
    }
    
    if (showSuccessDialog) {
        AlertDialog(
            onDismissRequest = { showSuccessDialog = false },
            icon = {
                Icon(
                    imageVector = Icons.Default.CheckCircle,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(48.dp)
                )
            },
            title = { Text("¡Regalo entregado!") },
            text = { Text("La entrega ha sido marcada como completada exitosamente.") },
            confirmButton = {
                Button(onClick = { showSuccessDialog = false }) {
                    Text("Aceptar")
                }
            }
        )
    }
    
    var evidenceImageUri by remember { mutableStateOf<android.net.Uri?>(null) }
    
    val imagePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: android.net.Uri? ->
        evidenceImageUri = uri
    }
    
    showConfirmDialog?.let { apadrinamientoId ->
        val nino = uiState.apadrinamientos.find { it.idApadrinamiento == apadrinamientoId }
            ?.let { uiState.ninosMap[it.idNino] }
        
        AlertDialog(
            onDismissRequest = { 
                showConfirmDialog = null 
                evidenceImageUri = null
            },
            title = { Text("Confirmar Entrega") },
            text = {
                Column {
                    Text("¿Estás seguro de que deseas marcar como entregado el regalo para ${nino?.nombre ?: "este niño"}?")
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    if (evidenceImageUri != null) {
                        AsyncImage(
                            model = evidenceImageUri,
                            contentDescription = "Evidencia",
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(200.dp)
                                .clip(RoundedCornerShape(8.dp)),
                            contentScale = ContentScale.Crop
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        TextButton(onClick = { evidenceImageUri = null }) {
                            Text("Eliminar foto")
                        }
                    } else {
                        OutlinedButton(
                            onClick = { imagePickerLauncher.launch("image/*") },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Icon(Icons.Default.Add, contentDescription = null)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Adjuntar foto de prueba")
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("Esta acción no se puede deshacer.", style = MaterialTheme.typography.bodySmall)
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.markAsDelivered(apadrinamientoId, evidenceImageUri, context)
                        showConfirmDialog = null
                        evidenceImageUri = null
                    },
                    enabled = !uiState.isUpdating
                ) {
                    Text("Confirmar")
                }
            },
            dismissButton = {
                OutlinedButton(onClick = { 
                    showConfirmDialog = null
                    evidenceImageUri = null
                }) {
                    Text("Cancelar")
                }
            }
        )
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
                actions = {
                    IconButton(onClick = { viewModel.loadDeliveries(context) }) {
                        Icon(imageVector = Icons.Default.Refresh, contentDescription = "Recargar")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.surface)
            )
        }
    ) { paddingValues ->
        Box(modifier = Modifier.fillMaxSize().padding(paddingValues)) {
            when {
                uiState.isLoading -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                }
                uiState.apadrinamientos.isEmpty() -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
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
                        }
                    }
                }
                else -> {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(uiState.apadrinamientos, key = { it.idApadrinamiento }) { apadrinamiento ->
                            DeliveryCard(
                                apadrinamiento = apadrinamiento,
                                nino = uiState.ninosMap[apadrinamiento.idNino],
                                puntoEntrega = apadrinamiento.idPuntoEntrega?.let { uiState.puntosEntregaMap[it] },
                                isExpanded = expandedCardId == apadrinamiento.idApadrinamiento,
                                onExpandToggle = {
                                    expandedCardId = if (expandedCardId == apadrinamiento.idApadrinamiento) null 
                                    else apadrinamiento.idApadrinamiento
                                },
                                onDeliverClick = { showConfirmDialog = apadrinamiento.idApadrinamiento },
                                isUpdating = uiState.isUpdating
                            )
                        }
                    }
                }
            }
        }
    }
}

@SuppressLint("MissingPermission")
@Composable
fun DeliveryCard(
    apadrinamiento: Apadrinamiento,
    nino: com.example.smilelinkapp.data.model.Nino?,
    puntoEntrega: com.example.smilelinkapp.data.model.PuntoEntrega?,
    isExpanded: Boolean,
    onExpandToggle: () -> Unit,
    onDeliverClick: () -> Unit,
    isUpdating: Boolean
) {
    val context = LocalContext.current
    var hasLocationPermission by remember { 
        mutableStateOf(
            ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
        ) 
    }
    var userLocation by remember { mutableStateOf<GeoPoint?>(null) }
    
    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        hasLocationPermission = permissions[Manifest.permission.ACCESS_FINE_LOCATION] == true ||
                               permissions[Manifest.permission.ACCESS_COARSE_LOCATION] == true
    }
    
    LaunchedEffect(isExpanded, hasLocationPermission) {
        if (isExpanded && hasLocationPermission) {
            try {
                val fusedLocationClient = LocationServices.getFusedLocationProviderClient(context)
                fusedLocationClient.lastLocation.addOnSuccessListener { location ->
                    location?.let {
                        userLocation = GeoPoint(it.latitude, it.longitude)
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error getting location", e)
            }
        }
    }
    
    Card(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onExpandToggle),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
        elevation = CardDefaults.cardElevation(defaultElevation = if (isExpanded) 4.dp else 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                    Icon(Icons.Default.Person, null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(24.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(nino?.nombre ?: "Cargando...", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                }
                Icon(
                    if (isExpanded) Icons.Default.KeyboardArrowUp else Icons.Default.KeyboardArrowDown,
                    if (isExpanded) "Contraer" else "Expandir",
                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            if (puntoEntrega != null) {
                Spacer(modifier = Modifier.height(8.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Place, null, tint = MaterialTheme.colorScheme.secondary, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(puntoEntrega.nombrePunto, style = MaterialTheme.typography.bodyMedium)
                }
            }
            
            if (isExpanded) {
                Spacer(modifier = Modifier.height(16.dp))
                HorizontalDivider()
                Spacer(modifier = Modifier.height(16.dp))
                
                // Child information section
                nino?.let {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(MaterialTheme.colorScheme.surface)
                            .padding(12.dp)
                    ) {
                        Text(
                            "Información del Ahijado",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("Nombre: ${it.nombre}", style = MaterialTheme.typography.bodySmall)
                        Text("Edad: ${it.edad} años", style = MaterialTheme.typography.bodySmall)
                        Text("Género: ${it.genero}", style = MaterialTheme.typography.bodySmall)
                        
                        if (it.necesidades.isNotEmpty()) {
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                "Regalos a entregar:",
                                style = MaterialTheme.typography.bodySmall,
                                fontWeight = FontWeight.Bold
                            )
                            it.necesidades.forEach { necesidad ->
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.padding(vertical = 2.dp)
                                ) {
                                    Icon(
                                        Icons.Default.ShoppingCart,
                                        null,
                                        modifier = Modifier.size(16.dp),
                                        tint = MaterialTheme.colorScheme.primary
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(necesidad, style = MaterialTheme.typography.bodyMedium)
                                }
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                }
                
                if (puntoEntrega != null) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(MaterialTheme.colorScheme.surface)
                            .padding(12.dp)
                    ) {
                        Text("Ubicación de Entrega", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("Punto: ${puntoEntrega.nombrePunto}", style = MaterialTheme.typography.bodySmall)
                        Text("Dirección: ${puntoEntrega.direccionFisica}", style = MaterialTheme.typography.bodySmall)
                        
                        Spacer(modifier = Modifier.height(12.dp))
                        
                        if (!hasLocationPermission) {
                            Button(
                                onClick = {
                                    permissionLauncher.launch(
                                        arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION)
                                    )
                                },
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Icon(Icons.Default.LocationOn, null, modifier = Modifier.size(20.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Activar Ubicación")
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                        }
                        
                        Box(modifier = Modifier.fillMaxWidth().height(200.dp).clip(RoundedCornerShape(8.dp))) {
                            MapViewComposable(
                                deliveryPoint = GeoPoint(puntoEntrega.latitud, puntoEntrega.longitud),
                                userLocation = userLocation,
                                deliveryPointName = puntoEntrega.nombrePunto
                            )
                        }
                        
                        Spacer(modifier = Modifier.height(12.dp))
                        
                        // Botón para abrir en Google Maps
                        OutlinedButton(
                            onClick = {
                                openLocationInGoogleMaps(
                                    context = context,
                                    latitude = puntoEntrega.latitud,
                                    longitude = puntoEntrega.longitud,
                                    placeName = puntoEntrega.nombrePunto
                                )
                            },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Icon(
                                imageVector = Icons.Default.LocationOn,
                                contentDescription = null,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Abrir en Google Maps")
                        }
                    }
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                Button(
                    onClick = onDeliverClick,
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !isUpdating
                ) {
                    if (isUpdating) {
                        CircularProgressIndicator(modifier = Modifier.size(20.dp), color = MaterialTheme.colorScheme.onPrimary, strokeWidth = 2.dp)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Procesando...")
                    } else {
                        Icon(Icons.Default.CheckCircle, null, modifier = Modifier.size(20.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Entregar Regalo", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
fun MapViewComposable(
    deliveryPoint: GeoPoint,
    userLocation: GeoPoint?,
    deliveryPointName: String
) {
    var routePoints by remember { mutableStateOf<List<GeoPoint>>(emptyList()) }
    
    LaunchedEffect(userLocation) {
        if (userLocation != null) {
            routePoints = fetchRoute(userLocation, deliveryPoint)
        }
    }
    
    AndroidView(
        factory = { ctx ->
            MapView(ctx).apply {
                setTileSource(TileSourceFactory.MAPNIK)
                setMultiTouchControls(true)
                controller.setZoom(15.0)
                controller.setCenter(deliveryPoint)
                
                val deliveryMarker = Marker(this).apply {
                    position = deliveryPoint
                    setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM)
                    title = deliveryPointName
                    icon = createMarkerDrawable(ctx, Color.RED)
                }
                overlays.add(deliveryMarker)
            }
        },
        update = { mapView ->
            mapView.overlays.removeAll { it is Marker && (it as Marker).position == userLocation }
            mapView.overlays.removeAll { it is Polyline }
            
            if (userLocation != null) {
                val userMarker = Marker(mapView).apply {
                    position = userLocation
                    setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM)
                    title = "Tu ubicación"
                    icon = createMarkerDrawable(mapView.context, Color.GREEN)
                }
                mapView.overlays.add(userMarker)
                
                val centerLat = (userLocation.latitude + deliveryPoint.latitude) / 2
                val centerLon = (userLocation.longitude + deliveryPoint.longitude) / 2
                mapView.controller.animateTo(GeoPoint(centerLat, centerLon))
                
                val latDiff = Math.abs(userLocation.latitude - deliveryPoint.latitude)
                val lonDiff = Math.abs(userLocation.longitude - deliveryPoint.longitude)
                val maxDiff = Math.max(latDiff, lonDiff)
                val zoomLevel = when {
                    maxDiff > 0.1 -> 11.0
                    maxDiff > 0.05 -> 12.0
                    else -> 13.0
                }
                mapView.controller.setZoom(zoomLevel)
                
                if (routePoints.isNotEmpty()) {
                    val routeLine = Polyline(mapView).apply {
                        setPoints(routePoints)
                        outlinePaint.color = Color.BLUE
                        outlinePaint.strokeWidth = 8f
                    }
                    mapView.overlays.add(routeLine)
                }
            }
            
            mapView.invalidate()
        }
    )
}

/**
 * Abre la ubicación en Google Maps u otras aplicaciones de mapas disponibles
 * @param context Contexto de la aplicación
 * @param latitude Latitud del punto
 * @param longitude Longitud del punto
 * @param placeName Nombre del lugar (opcional)
 */
fun openLocationInGoogleMaps(
    context: Context,
    latitude: Double,
    longitude: Double,
    placeName: String? = null
) {
    try {
        // Primero intentamos abrir con Google Maps directamente
        val googleMapsUri = if (placeName != null) {
            // URI con nombre del lugar
            Uri.parse("geo:0,0?q=$latitude,$longitude(${Uri.encode(placeName)})")
        } else {
            // URI solo con coordenadas
            Uri.parse("geo:$latitude,$longitude")
        }
        
        val mapIntent = Intent(Intent.ACTION_VIEW, googleMapsUri).apply {
            setPackage("com.google.android.apps.maps")
        }
        
        // Verificar si Google Maps está instalado
        if (mapIntent.resolveActivity(context.packageManager) != null) {
            context.startActivity(mapIntent)
        } else {
            // Si no está Google Maps, usar URI genérico que abrirá cualquier app de mapas
            val fallbackUri = if (placeName != null) {
                Uri.parse("https://www.google.com/maps/search/?api=1&query=$latitude,$longitude&query_place_id=${Uri.encode(placeName)}")
            } else {
                Uri.parse("https://www.google.com/maps/search/?api=1&query=$latitude,$longitude")
            }
            
            val fallbackIntent = Intent(Intent.ACTION_VIEW, fallbackUri)
            
            // Si hay alguna app que pueda manejar esto, la abrimos
            if (fallbackIntent.resolveActivity(context.packageManager) != null) {
                context.startActivity(fallbackIntent)
            } else {
                // Último recurso: usar geo: que funciona con la mayoría de apps de mapas
                val geoIntent = Intent(Intent.ACTION_VIEW, Uri.parse("geo:$latitude,$longitude?q=$latitude,$longitude(${Uri.encode(placeName ?: "Ubicación")})"))
                context.startActivity(geoIntent)
            }
        }
    } catch (e: Exception) {
        Log.e(TAG, "Error al abrir Google Maps", e)
        // Mostrar mensaje de error al usuario
        android.widget.Toast.makeText(
            context,
            "No se pudo abrir la ubicación en Google Maps",
            android.widget.Toast.LENGTH_SHORT
        ).show()
    }
}

fun createMarkerDrawable(context: Context, color: Int): android.graphics.drawable.Drawable {
    val size = 60
    val bitmap = android.graphics.Bitmap.createBitmap(size, size, android.graphics.Bitmap.Config.ARGB_8888)
    val canvas = android.graphics.Canvas(bitmap)
    
    val borderPaint = android.graphics.Paint().apply {
        this.color = Color.WHITE
        style = android.graphics.Paint.Style.FILL
        isAntiAlias = true
    }
    canvas.drawCircle(size / 2f, size / 2f, size / 2f, borderPaint)
    
    val paint = android.graphics.Paint().apply {
        this.color = color
        style = android.graphics.Paint.Style.FILL
        isAntiAlias = true
    }
    canvas.drawCircle(size / 2f, size / 2f, (size / 2f) - 4, paint)
    
    return android.graphics.drawable.BitmapDrawable(context.resources, bitmap)
}

suspend fun fetchRoute(start: GeoPoint, end: GeoPoint): List<GeoPoint> {
    return withContext(Dispatchers.IO) {
        try {
            val url = "https://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=geojson"
            val connection = URL(url).openConnection() as HttpURLConnection
            connection.requestMethod = "GET"
            connection.connectTimeout = 5000
            connection.readTimeout = 5000
            
            val response = connection.inputStream.bufferedReader().use { it.readText() }
            val json = JSONObject(response)
            
            if (json.has("routes")) {
                val routes = json.getJSONArray("routes")
                if (routes.length() > 0) {
                    val geometry = routes.getJSONObject(0).getJSONObject("geometry").getJSONArray("coordinates")
                    val points = mutableListOf<GeoPoint>()
                    for (i in 0 until geometry.length()) {
                        val coord = geometry.getJSONArray(i)
                        points.add(GeoPoint(coord.getDouble(1), coord.getDouble(0)))
                    }
                    return@withContext points
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error fetching route", e)
        }
        emptyList()
    }
}
