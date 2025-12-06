package com.example.smilelinkapp.data.mock

import com.example.smilelinkapp.data.model.*

/**
 * Mock data provider for offline testing
 * Provides realistic sample data for all entities
 */
object MockDataProvider {
    
    // Mock Children (Niños)
    val mockNinos = listOf(
        Nino(
            idNino = "N001",
            nombre = "María González",
            edad = 8,
            genero = "Femenino",
            descripcion = "María es una niña alegre que ama dibujar y soñar con ser artista. Le encanta el color rosa y los unicornios.",
            necesidades = listOf("Mochila", "Útiles escolares", "Colores"),
            estadoApadrinamiento = "Disponible"
        ),
        Nino(
            idNino = "N002",
            nombre = "Carlos Ramírez",
            edad = 10,
            genero = "Masculino",
            descripcion = "Carlos es un niño curioso que le fascina la ciencia. Sueña con ser astronauta algún día.",
            necesidades = listOf("Libros de ciencia", "Telescopio", "Ropa deportiva"),
            estadoApadrinamiento = "Disponible"
        ),
        Nino(
            idNino = "N003",
            nombre = "Ana Sofía López",
            edad = 7,
            genero = "Femenino",
            descripcion = "Ana es muy tímida pero tiene un corazón enorme. Le encanta leer cuentos de hadas.",
            necesidades = listOf("Libros de cuentos", "Muñeca", "Zapatos"),
            estadoApadrinamiento = "Disponible"
        ),
        Nino(
            idNino = "N004",
            nombre = "Diego Martínez",
            edad = 9,
            genero = "Masculino",
            descripcion = "Diego es muy activo y le encanta el fútbol. Sueña con jugar profesionalmente.",
            necesidades = listOf("Balón de fútbol", "Tenis deportivos", "Uniforme"),
            estadoApadrinamiento = "Apadrinado",
            idPadrinoActual = "P001",
            fechaApadrinamientoActual = "2024-01-15"
        ),
        Nino(
            idNino = "N005",
            nombre = "Lucía Hernández",
            edad = 6,
            genero = "Femenino",
            descripcion = "Lucía es la más pequeña del grupo. Le encanta cantar y bailar.",
            necesidades = listOf("Vestido", "Zapatos", "Juguetes musicales"),
            estadoApadrinamiento = "Disponible"
        )
    )
    
    // Mock Sponsors (Padrinos)
    val mockPadrinos = listOf(
        Padrino(
            idPadrino = "P001",
            nombre = "Juan Pérez",
            email = "juan.perez@example.com",
            fechaRegistro = "2024-01-10",
            direccion = "Calle Principal 123",
            telefono = "555-0001",
            historialApadrinamientoIds = listOf("AP001")
        )
    )
    
    // Mock Sponsorships (Apadrinamientos)
    val mockApadrinamientos = listOf(
        Apadrinamiento(
            idApadrinamiento = "AP001",
            idPadrino = "P001",
            idNino = "N004",
            fechaInicio = "2024-01-15",
            tipoApadrinamiento = "Elección Padrino",
            estadoApadrinamientoRegistro = "Activo",
            entregasIds = listOf("E001"),
            ubicacionEntregaLat = 19.4326,
            ubicacionEntregaLng = -99.1332,
            direccionEntrega = "Av. Reforma 456, Col. Centro",
            idPuntoEntrega = "PE001"
        )
    )
    
    // Mock Deliveries (Entregas)
    val mockEntregas = listOf(
        Entrega(
            idEntrega = "E001",
            idApadrinamiento = "AP001",
            descripcionRegalo = "Balón de fútbol profesional y tenis deportivos",
            fechaProgramada = "2024-12-20",
            estadoEntrega = "Pendiente",
            idPuntoEntrega = "PE001"
        )
    )
    
    // Mock Delivery Points (Puntos de Entrega)
    val mockPuntosEntrega = listOf(
        PuntoEntrega(
            idPuntoEntrega = "PE001",
            nombrePunto = "Centro Comunitario Norte",
            direccionFisica = "Av. Reforma 456, Col. Centro",
            latitud = 19.4326,
            longitud = -99.1332,
            horarioAtencion = "Lunes a Viernes 9:00 - 17:00",
            contactoReferencia = "María Sánchez - 555-1234",
            estadoPunto = "Activo"
        ),
        PuntoEntrega(
            idPuntoEntrega = "PE002",
            nombrePunto = "Casa Hogar del Sur",
            direccionFisica = "Calle Juárez 789, Col. Sur",
            latitud = 19.3910,
            longitud = -99.1700,
            horarioAtencion = "Lunes a Sábado 10:00 - 18:00",
            contactoReferencia = "Pedro González - 555-5678",
            estadoPunto = "Activo"
        ),
        PuntoEntrega(
            idPuntoEntrega = "PE003",
            nombrePunto = "Fundación Esperanza",
            direccionFisica = "Blvd. Independencia 321, Col. Este",
            latitud = 19.4500,
            longitud = -99.1200,
            horarioAtencion = "Martes a Domingo 8:00 - 16:00",
            contactoReferencia = "Ana Rodríguez - 555-9012",
            estadoPunto = "Activo"
        )
    )
    
    // Mock Gift Requests (Solicitudes)
    val mockSolicitudes = listOf(
        SolicitudRegalo(
            idSolicitud = "SR001",
            idNino = "N001",
            descripcionSolicitud = "María necesita una mochila nueva para la escuela y útiles escolares básicos",
            fechaSolicitud = "2024-11-01",
            estadoSolicitud = "Abierta"
        ),
        SolicitudRegalo(
            idSolicitud = "SR002",
            idNino = "N002",
            descripcionSolicitud = "Carlos desea libros de ciencia para niños y un pequeño telescopio",
            fechaSolicitud = "2024-11-05",
            estadoSolicitud = "Abierta"
        )
    )
    
    /**
     * Get available children (not sponsored yet)
     */
    fun getAvailableNinos(): List<Nino> {
        return mockNinos.filter { it.estadoApadrinamiento == "Disponible" }
    }
    
    /**
     * Get sponsored children for a specific sponsor
     */
    fun getSponsoredNinosForPadrino(padrinoId: String): List<Nino> {
        return mockNinos.filter { it.idPadrinoActual == padrinoId }
    }
    
    /**
     * Get sponsorships for a specific sponsor
     */
    fun getApadrinamientosForPadrino(padrinoId: String): List<Apadrinamiento> {
        return mockApadrinamientos.filter { it.idPadrino == padrinoId }
    }
    
    /**
     * Get deliveries for a specific sponsorship
     */
    fun getEntregasForApadrinamiento(apadrinamientoId: String): List<Entrega> {
        return mockEntregas.filter { it.idApadrinamiento == apadrinamientoId }
    }
}
