package com.example.smilelinkapp.ui.components

import android.content.Context
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.example.smilelinkapp.data.local.SessionManager
import com.example.smilelinkapp.navigation.SmileLinkNavGraph
import com.example.smilelinkapp.navigation.Screen
import com.example.smilelinkapp.navigation.bottomNavItems

/**
 * Main app scaffold with bottom navigation
 */
@Composable
fun MainAppScaffold() {
    val context = LocalContext.current
    val sessionManager = remember { SessionManager(context) }
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentDestination = navBackStackEntry?.destination
    
    // Determine start destination based on session
    val startDestination = if (sessionManager.isLoggedIn()) {
        Screen.Home.route
    } else {
        Screen.Login.route
    }
    
    // Determine if we should show bottom navigation
    val showBottomBar = currentDestination?.route in listOf(
        Screen.Home.route,
        Screen.MyChildren.route,
        Screen.Deliveries.route,
        Screen.Profile.route
    )
    
    Scaffold(
        bottomBar = {
            if (showBottomBar) {
                NavigationBar(
                    containerColor = MaterialTheme.colorScheme.surface,
                    tonalElevation = 8.dp
                ) {
                    bottomNavItems.forEach { item ->
                        val selected = currentDestination?.hierarchy?.any { 
                            it.route == item.route 
                        } == true
                        
                        NavigationBarItem(
                            icon = { 
                                Icon(
                                    imageVector = item.icon,
                                    contentDescription = item.title
                                ) 
                            },
                            label = { 
                                Text(
                                    text = item.title,
                                    style = MaterialTheme.typography.labelSmall
                                ) 
                            },
                            selected = selected,
                            onClick = {
                                navController.navigate(item.route) {
                                    popUpTo(navController.graph.findStartDestination().id) {
                                        saveState = true
                                    }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = MaterialTheme.colorScheme.primary,
                                selectedTextColor = MaterialTheme.colorScheme.primary,
                                indicatorColor = MaterialTheme.colorScheme.primaryContainer,
                                unselectedIconColor = MaterialTheme.colorScheme.onSurfaceVariant,
                                unselectedTextColor = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        )
                    }
                }
            }
        }
    ) { paddingValues ->
        SmileLinkNavGraph(
            navController = navController,
            startDestination = startDestination
        )
    }
}

