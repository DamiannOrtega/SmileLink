package com.example.smilelinkapp.navigation

import androidx.compose.runtime.*
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.example.smilelinkapp.ui.screens.auth.LoginScreen
import com.example.smilelinkapp.ui.screens.auth.RegisterScreen
import com.example.smilelinkapp.ui.screens.detail.ChildDetailScreen
import com.example.smilelinkapp.ui.screens.home.HomeScreen
import com.example.smilelinkapp.ui.screens.deliveries.DeliveriesScreen
import com.example.smilelinkapp.ui.screens.mychildren.MyChildrenScreen
import com.example.smilelinkapp.ui.screens.onboarding.OnboardingScreen
import com.example.smilelinkapp.ui.screens.profile.ProfileScreen

/**
 * Main navigation graph for the app
 */
@Composable
fun SmileLinkNavGraph(
    navController: NavHostController,
    startDestination: String
) {
    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        // Login
        composable(Screen.Login.route) {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                },
                onNavigateToRegister = {
                    navController.navigate(Screen.Register.route)
                }
            )
        }
        
        // Register
        composable(Screen.Register.route) {
            RegisterScreen(
                onRegisterSuccess = {
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                },
                onNavigateToLogin = {
                    navController.popBackStack()
                }
            )
        }
        
        // Onboarding (legacy, can be removed if not needed)
        composable(Screen.Onboarding.route) {
            OnboardingScreen(
                onGetStarted = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(Screen.Onboarding.route) { inclusive = true }
                    }
                }
            )
        }
        
        // Home - Discovery
        composable(Screen.Home.route) {
            HomeScreen(
                onChildClick = { childId ->
                    navController.navigate(Screen.ChildDetail.createRoute(childId))
                }
            )
        }
        
        // Child Detail
        composable(
            route = Screen.ChildDetail.route,
            arguments = listOf(
                navArgument("childId") { type = NavType.StringType }
            )
        ) { backStackEntry ->
            val childId = backStackEntry.arguments?.getString("childId") ?: return@composable
            
            ChildDetailScreen(
                childId = childId,
                onBackClick = { navController.popBackStack() },
                onSponsorSuccess = {
                    navController.navigate(Screen.MyChildren.route) {
                        popUpTo(Screen.Home.route)
                    }
                }
            )
        }
        
        // My Sponsored Children
        composable(Screen.MyChildren.route) {
            MyChildrenScreen(
                onChildClick = { childId ->
                    navController.navigate(Screen.ChildDetail.createRoute(childId))
                }
            )
        }
        
        // Deliveries
        composable(Screen.Deliveries.route) {
            DeliveriesScreen()
        }
        
        // Profile
        composable(Screen.Profile.route) {
            ProfileScreen(
                onLogout = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }
    }
}

