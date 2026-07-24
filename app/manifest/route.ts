export async function GET() {
  const manifest = {
    name: "Alamdar Online English Academy",
    short_name: "Alamdar Academy",
    description: "Learn English language and communication skills with Alamdar",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#f59e0b",
    orientation: "any",
    scope: "/",
    categories: ["education", "learning"],
    lang: "en",
    dir: "ltr",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icon-maskable-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: "/icon-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  };

  return new Response(JSON.stringify(manifest), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
