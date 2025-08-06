'use client'

/**
 * Meta Pixel Component
 * 
 * Este componente gerencia a integração do Meta (Facebook) Pixel.
 * 
 * Correções aplicadas:
 * - Resolvido problema de duplicação de PageView removendo o disparo inicial do onload
 * - PageView agora é disparado apenas pelo useEffect que monitora rotas
 * - Garantido que o pixel seja inicializado apenas uma vez
 */

import { useEffect, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

declare global {
  interface Window {
    fbq: any
    _fbq: any
    FB_PIXEL_INITIALIZED: boolean
  }
}

const PIXEL_ID = '24169428459391565'

function MetaPixelInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Previne inicialização múltipla com flag dedicada
    if (window.FB_PIXEL_INITIALIZED) {
      return
    }

    // Marca como inicializado ANTES de carregar o script
    window.FB_PIXEL_INITIALIZED = true

    // Função de inicialização do pixel
    const initPixel = () => {
      if (window.fbq) return
      
      const n: any = (window.fbq = function() {
        // @ts-ignore
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
      })
      
      if (!window._fbq) window._fbq = n
      n.push = n
      n.loaded = true
      n.version = '2.0'
      n.queue = []
      
      const script = document.createElement('script')
      script.async = true
      script.src = 'https://connect.facebook.net/en_US/fbevents.js'
      
      script.onload = () => {
        // Inicializa o pixel apenas após o script carregar
        window.fbq('init', PIXEL_ID)
        // PageView será disparado pelo useEffect de tracking de rotas
      }
      
      const firstScript = document.getElementsByTagName('script')[0]
      firstScript.parentNode?.insertBefore(script, firstScript)
    }

    // Inicializa o pixel
    initPixel()

    // Adiciona noscript fallback
    const noscript = document.createElement('noscript')
    const img = document.createElement('img')
    img.height = 1
    img.width = 1
    img.style.display = 'none'
    img.src = `https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`
    noscript.appendChild(img)
    document.body.appendChild(noscript)

    // Cleanup function
    return () => {
      // Mantém a flag para prevenir re-inicialização
    }
  }, []) // Array vazio garante execução única

  // Rastreia PageView inicial e mudanças de página (SPA)
  useEffect(() => {
    // Aguarda o pixel estar completamente inicializado
    const checkAndTrack = () => {
      if (window.fbq && window.FB_PIXEL_INITIALIZED) {
        window.fbq('track', 'PageView')
        return true
      }
      return false
    }
    
    // Tenta imediatamente
    if (!checkAndTrack()) {
      // Se não conseguiu, tenta novamente após um pequeno delay
      const timer = setTimeout(() => {
        checkAndTrack()
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [pathname, searchParams])

  return null
}

export default function MetaPixel() {
  return (
    <Suspense fallback={null}>
      <MetaPixelInner />
    </Suspense>
  )
}