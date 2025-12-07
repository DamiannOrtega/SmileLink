package com.example.smilelinkapp.ui.screens.mychildren

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Info
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.example.smilelinkapp.data.model.Entrega
import com.example.smilelinkapp.ui.theme.SuccessGreen
import com.example.smilelinkapp.ui.theme.WarningOrange

@Composable
fun DeliveryStatusItem(
    entrega: Entrega,
    onEvidenceClick: () -> Unit = {}
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
                
                if (entrega.estadoEntrega == "Entregado" && entrega.evidenciaFotoPath != null) {
                    Text(
                        text = "Ver evidencia",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.clickable { onEvidenceClick() }
                    )
                }
            }
        }
    }
}
