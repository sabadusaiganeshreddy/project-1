# The Daily Edit

A fashion affiliate storefront for a US audience. The current name is provisional. The four initial finds are clearly labeled sample inspiration and have **no affiliate links**.

## Open your store and catalog manager

On this Mac, double-click **Start Store.command**. Keep its Terminal window open while working, then visit:

- Storefront: http://127.0.0.1:4173/
- Catalog manager: http://127.0.0.1:4173/manage

The manager runs only on your computer. It is not included in the public website. Visitors never need an account or checkout.

If macOS requires a different launch method, run `node scripts/manage.mjs` in this directory using Node.js 20 or newer. The launch file also supports the Node runtime bundled with the installed ChatGPT app.

## Your first launch

1. In the manager, choose your store name and tagline.
2. Archive the four samples when you have your first real products.
3. Add a title, image, original description, category, retailer, and approved affiliate URL for each real product. Uncheck “Sample inspiration.” Use your own or licensed images; copying photos from a retailer may require permission.
4. Enable the Amazon Associates setting if you participate in that program. It adds Amazon’s required identifying statement to the disclosure and product pages.
5. Create a **free Cloudflare Pages account/project** and use its free `your-project.pages.dev` address. A purchased domain is optional and would cost money.
6. Set that public URL under “Make the store yours” and save. This enables absolute social preview image URLs, canonical links, and a sitemap when real products are available.
7. Click **Download website ZIP**. In Cloudflare’s dashboard, use **Workers & Pages → Create application → Pages → drag and drop** to upload the ZIP. Dashboard wording may change. Use a Direct Upload Pages project, not a Worker application.
8. After deployment, check a product URL on your phone. Use this product page URL in your Pin, not the ZIP, local manager URL, or private review URL.
9. Add your public website to your affiliate program’s approved site list and follow that program’s rules before promoting affiliate links. Add clear affiliate/ad disclosures to the Pins as well.

Cloudflare official instructions: https://developers.cloudflare.com/pages/get-started/direct-upload/

## Daily updates

Automatic publishing is prepared for the existing Cloudflare project. Complete the one-time connection in **PUBLISHING.md**, then open the manager → add/edit/archive products → save → **Publish updates**. GitHub Actions builds and deploys the site. Check its Actions tab for deployment success. Local saves alone do not change the live site.

Until that connection is complete, the manual fallback is **Download website ZIP** → upload as a new production deployment to the **same** Cloudflare Pages project. Both methods retain your domain and old Pinterest URLs.

Archiving removes a find from the catalog and disables its retailer button. Its old page remains available, explains that the item is no longer featured, and suggests current finds. Restore it from the manager when needed. Product slugs cannot be changed after creation.

Back up this entire project folder, including `catalog.json` and `assets/`. The ZIP is the public website, not a backup of your editable catalog.

## Costs and hosting

This project uses no paid packages, database, checkout service, or subscription CMS. It is designed for Cloudflare Pages’ free static hosting plan with a free `pages.dev` subdomain. Optional publishing uses GitHub Actions and the Cloudflare API. Public repositories receive free standard Actions usage; private repositories have an included allowance. Do not enable paid runners or paid add-ons if you want to stay at $0.

Cloudflare Pages: https://www.cloudflare.com/products/pages/
Free-plan limits: https://developers.cloudflare.com/pages/platform/limits/

The separate Sites registration in `.openai/hosting.json` is for an owner-private review deployment. It is not the public free-hosting setup and should not be used as your Pinterest destination. The Cloudflare ZIP contains only `dist/` contents, without the Sites configuration or the catalog manager.

## Pinterest and affiliate transparency

A storefront is useful because it adds original descriptions, styling context, and a clear choice to visit a retailer. It does **not** guarantee that Pinterest will approve links or protect an account from enforcement. Pinterest allows affiliate content subject to its affiliate, commercial content, and spam guidelines. Avoid misleading redirects, repetitive posting, or hiding the commercial relationship.

- Pinterest: https://policy.pinterest.com/en/commercial-and-branded-content-guidelines
- FTC disclosures: https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking
- Amazon program policies: https://affiliate-program.amazon.com/help/operating/policies

Prices are deliberately checked on the retailer’s site. The storefront does not invent prices, product ratings, shipping promises, discounts, or product specifications. Descriptions must reflect the real item. No merchant Product/Offer structured data is generated for sample products. All-sample catalogs request no search indexing; real product pages can be indexed after you configure the public origin and rebuild.

## Technical notes

- Static HTML per product, with Open Graph metadata and accessible responsive layouts.
- Search, categories, sort, and saved finds. Saved finds stay in the visitor’s browser on that device.
- Local HTTP server bound to `127.0.0.1`; write requests use a per-launch token and reject cross-origin requests.
- Image uploads accept JPG, PNG, or WebP, up to 8 MB. The public export contains images, pages, CSS, JavaScript, and hosting headers only.
- `node scripts/build.mjs` rebuilds `dist/`; `node --test scripts/catalog.test.mjs` checks key catalog behavior.
- Local and hosted pages use absolute-root paths. Open them through the local server, not by double-clicking `dist/index.html`.
- Optional Google Fonts fall back to system fonts if unavailable. No tracking pixels or analytics are included. Update the privacy notice if you add services.

## Sample image sources

Illustrative images from Unsplash, downloaded for the sample mood board. These do not represent verified retailer products. Original photo identifiers: `1483985988355-763728e1935b` (hero), `1434389677669-e08b4cac3105` (knit), `1548036328-c9fa89d128fa` (bag), `1543163521-1bf539c55dd2` (shoes), `1535632066927-ab7c9ab60908` (earrings). Replace them with photos you are authorized to use for your actual listings.
