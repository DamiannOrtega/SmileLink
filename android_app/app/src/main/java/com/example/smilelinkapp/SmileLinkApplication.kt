package com.example.smilelinkapp

import android.app.Application
import coil.ImageLoader
import coil.ImageLoaderFactory
import coil.decode.SvgDecoder
import com.example.smilelinkapp.data.api.RetrofitClient

class SmileLinkApplication : Application(), ImageLoaderFactory {
    override fun onCreate() {
        super.onCreate()
        // Conecta Retrofit con la sesión para enviar el token JWT en cada petición.
        RetrofitClient.init(this)
    }

    override fun newImageLoader(): ImageLoader {
        return ImageLoader.Builder(this)
            .components {
                add(SvgDecoder.Factory())
            }
            .build()
    }
}
