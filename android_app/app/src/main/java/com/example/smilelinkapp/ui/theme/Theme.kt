package com.example.smilelinkapp.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val DarkColorScheme = darkColorScheme(
    primary = OceanBlueLight,
    onPrimary = Color.White,
    primaryContainer = OceanBlueDark,
    onPrimaryContainer = OceanBlueLight,
    
    secondary = MintGreen,
    onSecondary = TextPrimary,
    secondaryContainer = MintGreenDark,
    onSecondaryContainer = MintGreenLight,
    
    tertiary = WarmYellow,
    onTertiary = TextPrimary,
    
    background = Color(0xFF1C1C1E),
    onBackground = Color(0xFFE5E5E7),
    surface = Color(0xFF2C2C2E),
    onSurface = Color(0xFFE5E5E7),
    
    error = ErrorRed,
    onError = Color.White
)

private val LightColorScheme = lightColorScheme(
    primary = OceanBlue,
    onPrimary = Color.White,
    primaryContainer = OceanBlueLight,
    onPrimaryContainer = OceanBlueDark,
    
    secondary = MintGreen,
    onSecondary = TextPrimary,
    secondaryContainer = MintGreenLight,
    onSecondaryContainer = MintGreenDark,
    
    tertiary = WarmYellow,
    onTertiary = TextPrimary,
    tertiaryContainer = WarmYellowLight,
    onTertiaryContainer = WarmYellowDark,
    
    background = BackgroundWhite,
    onBackground = TextPrimary,
    surface = SurfaceWhite,
    onSurface = TextPrimary,
    surfaceVariant = DividerGray,
    onSurfaceVariant = TextSecondary,
    
    outline = DividerGray,
    
    error = ErrorRed,
    onError = Color.White,
    errorContainer = Color(0xFFFDEDED),
    onErrorContainer = ErrorRed
)

@Composable
fun SmileLinkAppTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    // Disable dynamic color to maintain brand consistency
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }

        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }
    
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.primary.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        shapes = Shapes,
        content = content
    )
}