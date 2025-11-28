package com.example.smilelinkapp.ui.screens.onboarding

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.example.smilelinkapp.ui.theme.MintGreen

@Composable
fun OnboardingScreen(
    onGetStarted: () -> Unit
) {
    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Spacer(modifier = Modifier.height(48.dp))
            
            // Hero section
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(24.dp)
            ) {
                // Logo/Icon placeholder
                Surface(
                    color = MintGreen.copy(alpha = 0.2f),
                    shape = MaterialTheme.shapes.extraLarge,
                    modifier = Modifier.size(120.dp)
                ) {
                    Box(
                        contentAlignment = Alignment.Center,
                        modifier = Modifier.fillMaxSize()
                    ) {
                        Text(
                            text = "😊",
                            style = MaterialTheme.typography.displayLarge
                        )
                    }
                }
                
                Text(
                    text = "SmileLink",
                    style = MaterialTheme.typography.displaySmall,
                    color = MaterialTheme.colorScheme.primary
                )
                
                Text(
                    text = "Conectando corazones,\ncambiando vidas",
                    style = MaterialTheme.typography.titleLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center
                )
            }
            
            // Features
            Column(
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                FeatureItem(
                    emoji = "👶",
                    title = "Descubre Niños",
                    description = "Conoce historias que tocarán tu corazón"
                )
                
                FeatureItem(
                    emoji = "💝",
                    title = "Apadrina con Amor",
                    description = "Haz realidad los sueños de un niño"
                )
                
                FeatureItem(
                    emoji = "📍",
                    title = "Entrega Fácil",
                    description = "Encuentra puntos de entrega cercanos"
                )
            }
            
            // CTA Button
            Column(
                verticalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Button(
                    onClick = onGetStarted,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp),
                    shape = MaterialTheme.shapes.medium
                ) {
                    Text(
                        "Comenzar",
                        style = MaterialTheme.typography.titleMedium
                    )
                }
                
                TextButton(
                    onClick = onGetStarted,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Ya tengo una cuenta")
                }
            }
        }
    }
}

@Composable
private fun FeatureItem(
    emoji: String,
    title: String,
    description: String
) {
    Row(
        horizontalArrangement = Arrangement.spacedBy(16.dp),
        verticalAlignment = Alignment.Top
    ) {
        Text(
            text = emoji,
            style = MaterialTheme.typography.headlineMedium
        )
        
        Column(
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurface
            )
            
            Text(
                text = description,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
