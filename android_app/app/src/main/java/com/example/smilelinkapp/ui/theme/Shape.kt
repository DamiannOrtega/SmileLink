package com.example.smilelinkapp.ui.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Shapes
import androidx.compose.ui.unit.dp

/**
 * SmileLink Shape System
 * Using rounded corners to evoke warmth and friendliness
 */
val Shapes = Shapes(
    // Small components (buttons, chips)
    small = RoundedCornerShape(12.dp),
    
    // Medium components (cards, dialogs)
    medium = RoundedCornerShape(16.dp),
    
    // Large components (bottom sheets, large cards)
    large = RoundedCornerShape(24.dp),
    
    // Extra large (modals, full-screen dialogs)
    extraLarge = RoundedCornerShape(28.dp)
)
