package com.example.smilelinkapp.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Place
import androidx.compose.material.icons.filled.Person

/**
 * Navigation routes for the app
 */
sealed class Screen(val route: String) {
    object Login : Screen("login")
    object Register : Screen("register")
    object Onboarding : Screen("onboarding")
    object Home : Screen("home")
    object ChildDetail : Screen("child_detail/{childId}") {
        fun createRoute(childId: String) = "child_detail/$childId"
    }
    object MyChildren : Screen("my_children")
    object Map : Screen("map")
    object Profile : Screen("profile")
}

/**
 * Bottom navigation items
 */
sealed class BottomNavItem(
    val route: String,
    val title: String,
    val icon: androidx.compose.ui.graphics.vector.ImageVector
) {
    object Home : BottomNavItem(
        route = Screen.Home.route,
        title = "Descubrir",
        icon = Icons.Default.Search
    )
    
    object MyChildren : BottomNavItem(
        route = Screen.MyChildren.route,
        title = "Mis Ahijados",
        icon = Icons.Default.Favorite
    )
    
    object Map : BottomNavItem(
        route = Screen.Map.route,
        title = "Mapa",
        icon = Icons.Default.Place
    )
    
    object Profile : BottomNavItem(
        route = Screen.Profile.route,
        title = "Perfil",
        icon = Icons.Default.Person
    )
}

val bottomNavItems = listOf(
    BottomNavItem.Home,
    BottomNavItem.MyChildren,
    BottomNavItem.Map,
    BottomNavItem.Profile
)


