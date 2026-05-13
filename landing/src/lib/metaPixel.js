const PIXEL_ID = '1298967099044833'

export function initMetaPixel() {
  if (typeof window === 'undefined' || window.fbq) return

  const f = window
  const b = document
  const n = (f.fbq = function () {
    n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
  })
  if (!f._fbq) f._fbq = n
  n.push = n
  n.loaded = true
  n.version = '2.0'
  n.queue = []

  const t = b.createElement('script')
  t.async = true
  t.src = 'https://connect.facebook.net/en_US/fbevents.js'
  const s = b.getElementsByTagName('script')[0]
  s.parentNode.insertBefore(t, s)

  window.fbq('init', PIXEL_ID)
  window.fbq('track', 'PageView')
}
