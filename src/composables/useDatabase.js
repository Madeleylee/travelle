import { turso } from "../services/tursoClient"

// Obtener todos los países junto con sus ciudades
export async function getPaisesConCiudades() {
    try {
        console.log("Ejecutando getPaisesConCiudades")
        const result = await turso.execute(`
            SELECT p.id_pais, p.nombre AS pais, p.bandera, c.id_ciudad, c.nombre AS ciudad
            FROM Paises p
            LEFT JOIN Ciudades c ON c.id_pais = p.id_pais
            ORDER BY p.nombre, c.nombre
        `)

        console.log("Resultado de la consulta:", result)

        const paises = {}
        for (const row of result.rows) {
            if (!paises[row.pais]) {
                paises[row.pais] = {
                    id_pais: row.id_pais,
                    nombre: row.pais,
                    bandera: row.bandera, // Incluir la URL de la bandera
                    ciudades: [],
                }
            }
            if (row.ciudad) {
                // Usar id_ciudad en lugar de id para mantener consistencia
                paises[row.pais].ciudades.push({
                    id_ciudad: row.id_ciudad,
                    nombre: row.ciudad,
                })
            }
        }

        const paisesArray = Object.values(paises)
        console.log("Países procesados:", paisesArray)
        return paisesArray
    } catch (error) {
        console.error("Error en getPaisesConCiudades:", error)
        throw error
    }
}

// Obtener todas las ciudades
export async function getCiudades() {
    try {
        const result = await turso.execute(`SELECT id_ciudad, nombre, id_pais FROM Ciudades ORDER BY nombre`)
        return result.rows
    } catch (error) {
        console.error("Error en getCiudades:", error)
        throw error
    }
}

// Obtener lugares por ciudad
export async function getLugaresPorCiudad(idCiudad) {
    try {
        console.log(`Ejecutando getLugaresPorCiudad con id_ciudad: ${idCiudad}`)

        if (!idCiudad) {
            console.error("ID de ciudad no válido:", idCiudad)
            return []
        }

        const result = await turso.execute({
            sql: `SELECT id_lugar, nombre, descripcion, precio, valoracion, latitud, longitud, imagen1, imagen2, imagen3
                FROM Lugares
                WHERE id_ciudad = ?
                ORDER BY nombre`,
            args: [idCiudad],
        })

        console.log(`Lugares encontrados para ciudad ${idCiudad}:`, result.rows)
        return result.rows
    } catch (error) {
        console.error(`Error en getLugaresPorCiudad para id_ciudad ${idCiudad}:`, error)
        throw error
    }
}

// Obtener un lugar por su ID
export async function getLugarPorId(idLugar) {
    const result = await turso.execute({
        sql: `SELECT id_lugar, nombre, descripcion, precio, valoracion, latitud, longitud, imagen1, imagen2, imagen3, id_ciudad
          FROM Lugares
          WHERE id_lugar = ?`,
        args: [idLugar],
    })
    return result.rows[0]
}

// Obtener categorías asociadas a un lugar
export async function getCategoriasPorLugar(idLugar) {
    const result = await turso.execute({
        sql: `
      SELECT c.nombre
      FROM Categorias c
      INNER JOIN Lugares_Categorias lc ON lc.id_categoria = c.id_categoria
      WHERE lc.id_lugar = ?
    `,
        args: [idLugar],
    })
    return result.rows.map((row) => row.nombre)
}

// Buscar texto en países, ciudades o lugares
export async function buscarTodo(texto) {
    const query = `%${texto.toLowerCase()}%`
    const result = await turso.execute({
        sql: `
      SELECT 
        p.id_pais,
        p.nombre AS pais,
        p.bandera,
        c.id_ciudad,
        c.nombre AS ciudad,
        l.id_lugar,
        l.nombre AS lugar
      FROM Paises p
      LEFT JOIN Ciudades c ON c.id_pais = p.id_pais
      LEFT JOIN Lugares l ON l.id_ciudad = c.id_ciudad
      WHERE LOWER(p.nombre) LIKE ? OR LOWER(c.nombre) LIKE ? OR LOWER(l.nombre) LIKE ?
      ORDER BY p.nombre, c.nombre, l.nombre
    `,
        args: [query, query, query],
    })

    // Transformar los resultados para incluir IDs y banderas
    return result.rows.map((row) => ({
        id: row.id_lugar || row.id_ciudad || row.id_pais, // Usar el ID más específico disponible
        pais: row.pais,
        bandera: row.bandera,
        ciudad: row.ciudad || null,
        lugar: row.lugar || null,
    }))
}

// Obtener el nombre de la ciudad por ID del lugar
export async function getCiudadPorLugarId(idLugar) {
    const result = await turso.execute({
        sql: `
      SELECT c.nombre AS nombreCiudad
      FROM Lugares l
      INNER JOIN Ciudades c ON l.id_ciudad = c.id_ciudad
      WHERE l.id_lugar = ?
    `,
        args: [idLugar],
    })

    // Devuelve solo el nombre de la ciudad o cadena vacía si no se encuentra
    return result.rows.length > 0 ? result.rows[0].nombreCiudad : ""
}

// Obtener destinos aleatorios con nombre de país y ciudad
export async function getDestinosAleatorios(cantidad = 6) {
    const result = await turso.execute(
        `
    SELECT 
      l.id_lugar,
      l.nombre,
      l.descripcion,
      l.precio,
      l.valoracion,
      l.imagen1,
      l.imagen2,
      l.imagen3,
      c.nombre AS ciudad,
      p.nombre AS pais,
      p.bandera
    FROM Lugares l
    JOIN Ciudades c ON l.id_ciudad = c.id_ciudad
    JOIN Paises p ON c.id_pais = p.id_pais
    ORDER BY RANDOM()
    LIMIT ?
  `,
        [cantidad],
    )

    return result.rows
}

// Buscar un lugar por nombre, ciudad y país
export async function getLugarPorNombreCiudadPais(nombreLugar, nombreCiudad, nombrePais) {
    const result = await turso.execute({
        sql: `
      SELECT l.id_lugar, l.nombre, l.descripcion, l.precio, l.valoracion, l.latitud, l.longitud,
             l.imagen1, l.imagen2, l.imagen3, p.bandera
      FROM Lugares l
      JOIN Ciudades c ON l.id_ciudad = c.id_ciudad
      JOIN Paises p ON c.id_pais = p.id_pais
      WHERE l.nombre = ? AND c.nombre = ? AND p.nombre = ?
      LIMIT 1
    `,
        args: [nombreLugar, nombreCiudad, nombrePais],
    })

    if (result.rows.length === 0) return null

    const lugar = result.rows[0]

    // Devolvemos el lugar con las imágenes en un array
    return {
        ...lugar,
        imagenes: [lugar.imagen1, lugar.imagen2, lugar.imagen3].filter(Boolean),
    }
}

// Nueva función: Obtener país por ID
export async function getPaisPorId(idPais) {
    const result = await turso.execute({
        sql: `
      SELECT id_pais, nombre, bandera
      FROM Paises
      WHERE id_pais = ?
    `,
        args: [idPais],
    })

    return result.rows.length > 0 ? result.rows[0] : null
}

// Nueva función: Obtener todos los países (sin ciudades)
export async function getPaises() {
    try {
        const result = await turso.execute(`
            SELECT id_pais, nombre, bandera
            FROM Paises
            ORDER BY nombre
        `)

        return result.rows
    } catch (error) {
        console.error("Error en getPaises:", error)
        throw error
    }
}

// Obtener lugares cercanos a una ubicación
export async function getLugaresCercanos(latitud, longitud, distanciaKm = 50) {
    try {
        console.log(`Ejecutando getLugaresCercanos con lat: ${latitud}, lng: ${longitud}, distancia: ${distanciaKm}km`)

        // Convertir coordenadas a radianes para el cálculo
        const latRad = (latitud * Math.PI) / 180
        const lonRad = (longitud * Math.PI) / 180

        // Calcular los límites aproximados del área de búsqueda para optimizar la consulta
        // 1 grado de latitud ≈ 111 km
        const latDelta = distanciaKm / 111.0
        const lonDelta = distanciaKm / (111.0 * Math.cos(latRad))

        const minLat = latitud - latDelta
        const maxLat = latitud + latDelta
        const minLon = longitud - lonDelta
        const maxLon = longitud + lonDelta

        // Consulta optimizada para SQLite
        const result = await turso.execute({
            sql: `
        SELECT 
          l.id_lugar, 
          l.nombre, 
          l.descripcion, 
          l.precio, 
          l.valoracion, 
          l.latitud, 
          l.longitud, 
          l.imagen1,
          l.imagen2,
          l.imagen3,
          c.nombre AS ciudad,
          c.id_ciudad,
          p.nombre AS pais,
          p.id_pais,
          p.bandera,
          (6371 * 2 * asin(sqrt(
            pow(sin((?1 - radians(l.latitud)) / 2), 2) + 
            cos(?1) * cos(radians(l.latitud)) * 
            pow(sin((?2 - radians(l.longitud)) / 2), 2)
          ))) AS distancia
        FROM Lugares l
        JOIN Ciudades c ON l.id_ciudad = c.id_ciudad
        JOIN Paises p ON c.id_pais = p.id_pais
        WHERE 
          l.latitud BETWEEN ?3 AND ?4 AND
          l.longitud BETWEEN ?5 AND ?6
        ORDER BY distancia
        LIMIT 50
      `,
            args: [latRad, lonRad, minLat, maxLat, minLon, maxLon],
        })

        // Filtrar los resultados por la distancia exacta
        const lugaresEnRango = result.rows.filter((lugar) => lugar.distancia <= distanciaKm)

        console.log(`Lugares cercanos encontrados: ${lugaresEnRango.length}`)
        return lugaresEnRango
    } catch (error) {
        console.error("Error en getLugaresCercanos:", error)
        throw error
    }
}

// Obtener todos los lugares con información de ciudad y país
export async function getTodosLosLugares() {
    try {
        console.log("Ejecutando getTodosLosLugares")

        const result = await turso.execute(`
      SELECT 
        l.id_lugar, 
        l.nombre, 
        l.descripcion, 
        l.precio, 
        l.valoracion, 
        l.latitud, 
        l.longitud, 
        l.imagen1,
        l.imagen2,
        l.imagen3,
        c.nombre AS ciudad,
        c.id_ciudad,
        p.nombre AS pais,
        p.id_pais,
        p.bandera
      FROM Lugares l
      JOIN Ciudades c ON l.id_ciudad = c.id_ciudad
      JOIN Paises p ON c.id_pais = p.id_pais
      ORDER BY p.nombre, c.nombre, l.nombre
    `)

        console.log(`Total de lugares encontrados: ${result.rows.length}`)
        return result.rows
    } catch (error) {
        console.error("Error en getTodosLosLugares:", error)
        throw error
    }
}
