package com.example.smilelinkapp.ui.screens.home

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.smilelinkapp.ui.components.ChildCard
import com.example.smilelinkapp.ui.components.EmptyState
import com.example.smilelinkapp.ui.components.ErrorMessage
import com.example.smilelinkapp.ui.components.LoadingIndicator

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    onChildClick: (String) -> Unit,
    viewModel: HomeViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val searchQuery by viewModel.searchQuery.collectAsState()
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { 
                    Text(
                        "Descubre Niños",
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
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Search bar
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { viewModel.updateSearchQuery(it) },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                placeholder = { Text("Buscar por nombre o necesidad...") },
                leadingIcon = {
                    Icon(
                        imageVector = Icons.Default.Search,
                        contentDescription = "Buscar"
                    )
                },
                singleLine = true,
                shape = MaterialTheme.shapes.medium
            )
            
            // Filters Row
            val genderFilter by viewModel.genderFilter.collectAsState()
            val sortBy by viewModel.sortBy.collectAsState()
            var genderMenuExpanded by remember { mutableStateOf(false) }
            var sortMenuExpanded by remember { mutableStateOf(false) }
            
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
                    .padding(bottom = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Gender Filter Box
                Box(modifier = Modifier.weight(1f)) {
                    OutlinedButton(
                        onClick = { genderMenuExpanded = true },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Género: $genderFilter")
                    }
                    DropdownMenu(
                        expanded = genderMenuExpanded,
                        onDismissRequest = { genderMenuExpanded = false }
                    ) {
                        listOf("Todos", "Masculino", "Femenino").forEach { option ->
                            DropdownMenuItem(
                                text = { Text(option) },
                                onClick = {
                                    viewModel.updateGenderFilter(option)
                                    genderMenuExpanded = false
                                }
                            )
                        }
                    }
                }

                // Sort By Box
                Box(modifier = Modifier.weight(1f)) {
                    OutlinedButton(
                        onClick = { sortMenuExpanded = true },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Orden: $sortBy")
                    }
                    DropdownMenu(
                        expanded = sortMenuExpanded,
                        onDismissRequest = { sortMenuExpanded = false }
                    ) {
                        listOf("Nombre", "Nombre (Z-A)", "Edad (Menor)", "Edad (Mayor)").forEach { option ->
                            DropdownMenuItem(
                                text = { Text(option) },
                                onClick = {
                                    viewModel.updateSortBy(option)
                                    sortMenuExpanded = false
                                }
                            )
                        }
                    }
                }
            }
            
            // Content
            when (val state = uiState) {
                is HomeUiState.Loading -> {
                    LoadingIndicator()
                }
                
                is HomeUiState.Success -> {
                    val filteredNinos = viewModel.getFilteredChildren(state.ninos)
                    
                    if (filteredNinos.isEmpty()) {
                        EmptyState(
                            title = "No se encontraron niños",
                            message = "Intenta con otra búsqueda",
                            emoji = "🔍"
                        )
                    } else {
                        LazyColumn(
                            contentPadding = PaddingValues(16.dp),
                            verticalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            items(filteredNinos) { nino ->
                                ChildCard(
                                    nino = nino,
                                    onClick = { onChildClick(nino.idNino) }
                                )
                            }
                        }
                    }
                }
                
                is HomeUiState.Error -> {
                    ErrorMessage(
                        message = state.message,
                        onRetry = { viewModel.loadAvailableChildren() }
                    )
                }
            }
        }
    }
}
