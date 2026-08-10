export const bobKnowledge = {
  greetings: {
    keywords: ["hello", "hi", "hey", "greetings", "what's up", "sup", "howdy"],
    responses: [
      "Hey there! I'm Nova — your Print Cosmos guide. Ask me anything about 3D printing, our platform, or how to get started!",
      "Hello! Nova here, ready to help. Whether you're new to 3D printing or a seasoned maker, I can point you in the right direction.",
      "Hi! I'm Nova, your onboard AI helper. What can I help you with today?",
      "Greetings, maker! Nova here. I can help you navigate Print Cosmos — from listing your first design to troubleshooting prints.",
    ],
  },

  basics: {
    keywords: ["nozzle", "nozzle bed", "print bed", "bed leveling", "heated bed"],
    responses: [
      "A nozzle is the part of your 3D printer that melts and extrudes filament onto the build surface. Most printers use a 0.4mm nozzle by default, but you can swap in different sizes — finer nozzles (0.2mm) give more detail, wider ones (0.6mm+) print faster. Think of it like the tip of a paintbrush: smaller for detail, bigger for coverage.",
      "The print bed (also called the build plate) is the surface your model sits on while printing. Most Print Cosmos recommended printers use a heated glass bed at 60°C for PLA or 80–100°C for ABS/PC. A well-leveled bed is critical — the first layer should stick evenly across the whole surface!",
      "Bed leveling (sometimes called tramming or leveling) ensures your nozzle is the correct distance from the bed. Too close = filament won't stick or you'll scrape the nozzle. Too far = layer separation. Most printers auto-level now, but it's worth checking manually for precision work.",
      "A heated bed prevents warping by keeping the bottom layers warm during printing. PLA needs 60°C, PETG needs 70–80°C, and ABS needs 90–110°C. Not all printers have heated beds — and that's okay! PLA prints well on a cold bed with proper adhesion (glue stick or blue tape works great).",
    ],
  },

  infill: {
    keywords: ["infill", "infill %", "fill density", "sparse", "density", "hollow", "solid"],
    responses: [
      "Infill is the internal structure inside a printed object — it's what fills the space between the outer walls (called perimeters or shells). Think of it like the inside of a house: the walls are the perimeters, and infill is the framing and insulation inside.",
      "Infill percentage controls how hollow or solid your print is. For most functional parts: 10–20% infill is plenty for display models, 20–50% gives good strength for practical items like phone cases, and 50–100% is for high-stress parts like mechanical gears. Higher infill = more filament, longer print time, and stronger part, so there's always a trade-off!",
      "Common infill patterns include: grid (square — good all-around), triangles (strong in all directions), gyroid (organic, great strength-to-weight), and honeycomb (lightweight with decent strength). Most slicers default to grid, which is a solid starting choice.",
      "For beginners: start with 20% infill and grid pattern. If your part fails under stress, bump it up to 30–40%. You rarely need more than 50% for most use cases, and going above 70% often just wastes filament without meaningful strength gains.",
    ],
  },

  supports: {
    keywords: ["supports", "support", "raft", "skirt", "brim", " scaffolding"],
    responses: [
      "Supports (also called support structures) are temporary structures your printer creates under overhangs and complex geometry. Think of them like scaffolding around a building — they hold up areas that would otherwise sag or collapse mid-print. When your print is done, you snap them off and they're gone!",
      "Not every print needs supports. As a general rule: if your model has overhangs greater than about 45 degrees from vertical, you'll need supports. Simple shapes like boxes and pyramids usually don't need them. Flat bridges between two points might need them if they span a gap without support below.",
      "In Print Cosmos, you can toggle support generation in the Designer Studio when preparing your model for print. The system auto-detects where supports are needed, but you can also manually mark areas. Tip: enable 'support on build plate only' if you want easier cleanup — supports will only connect to the bed, not to your model's surfaces.",
      "To remove supports cleanly: use needle-nose pliers or flush cutters for the larger chunks, then an exacto knife or sanding stick for remaining nubs. Go slow — you don't want to gouge your model. For delicate prints, let the model cool completely first; warm support material is softer and easier to remove.",
    ],
  },

  materials: {
    keywords: ["pla", "petg", "abs", "filament", "material", "filament type", "tpu", "nylon", "resin", "sla", "fda"],
    responses: [
      "PLA (Polylactic Acid) is the best beginner filament — it's easy to print, biodegradable, doesn't warp, and comes in tons of colors. Print at 190–220°C with no heated bed required. Trade-off: PLA is brittle and has low heat resistance, so don't use it for parts that'll see stress or get hot (like car dashboard pieces).",
      "PETG (Polyethylene Terephthalate Glycol) is the sweet spot between beginner-friendliness and durability. It's slightly harder to print than PLA (needs a heated bed at 70–80°C) but is much tougher, flexier, and more heat-resistant. Great for functional parts, cases, and anything that needs to last.",
      "ABS (Acrylonitrile Butadiene Styrene) is the classic engineering plastic — the stuff Lego is made from. It's strong, heat-resistant, and can be acetone-smoothed for a glossy finish. But it's tricky to print: it warps badly, needs an enclosure, a heated bed at 90–110°C, and good ventilation (it has fumes). Recommended for experienced makers only.",
      "TPU (Thermoplastic Polyurethane) is your flexible filament. It's like printing with rubber — great for phone cases, gaskets, rubber bands, and soft grips. Printing TPU requires a direct-drive extruder (not a Bowden setup) and slow speeds. The key is keeping your retraction distance very short to avoid clogs.",
      "When in doubt for starting out, go PLA. Once you're comfortable, graduate to PETG for functional parts, and explore ABS/TPU as your skills grow. All three are widely available on Print Cosmos and work with most FDM printers.",
    ],
  },

  listing: {
    keywords: ["list", "listing", "how to sell", "how to list", "upload", "publish", "create listing", "make a listing", "selling", "sell something"],
    responses: [
      "Great question! To list something for sale on Print Cosmos: 1) Go to your Dashboard, 2) Click 'Create New Listing', 3) Upload your 3D model file (STL, OBJ, or our native .pcos format), 4) Fill in the details — title, description, price, category, and filament color options, 5) Choose whether it's free, paid, or a 'pay-what-you-want' model, 6) Click 'Publish' and your listing goes live!",
      "The Print Cosmos Design Studio is your workspace for preparing models before listing. You can view your model in 3D, add supports, adjust orientation, set infill defaults, and preview the slice. It's built right into the browser — no software to install. Access it from the 'Studio' tab in your dashboard.",
      "Pricing works with a marketplace fee structure: Print Cosmos takes a commission on every sale. The commission percentage varies by listing type and your seller tier. You can see the exact fee before you publish, and it's all calculated automatically in the pricing section of your listing form.",
      "To edit or remove a listing after it's published: go to your Dashboard, find the listing in your 'My Listings' section, click the three-dot menu, and choose 'Edit' or 'Delete'. Edited listings get a small visibility boost on the marketplace to reflect the update!",
    ],
  },

  designStudio: {
    keywords: ["design studio", "studio", "designer", "3d designer", "modeling", "3d workshop", "workshop", "create 3d model", "design tool", "builder", "mesh", "import model"],
    responses: [
      "The Print Cosmos Design Studio is a web-based 3D modeling workspace built right into your browser! It lets you create, edit, and prepare 3D models for printing without installing any software. Features include a full modeling toolkit, support generation, slice preview, and direct publishing to the marketplace.",
      "To use the Design Studio: 1) Click '3D Designer Workshop' in the top navigation, 2) You can start from scratch with basic shapes (cubes, spheres, cylinders) or import an existing model file (STL, OBJ), 3) Use the toolbar to combine shapes, carve holes, add patterns, and refine your model, 4) The right panel shows print settings like layer height, infill, and supports, 5) Click 'Prepare for Print' to generate supports and preview your slice!",
      "The Design Studio supports real-time collaboration — you can invite other makers to co-design a model. You'll see each other's cursors and changes in real-time. Perfect for maker teams and collaborative projects!",
      "If you're new to 3D modeling, start with the 'Starter Templates' in the Design Studio. They come pre-built with common shapes and print-ready settings so you can learn the interface while creating something that actually works.",
    ],
  },

  threads: {
    keywords: ["thread", "threads", "filament thread", "thread currency", "coins", "tip", "tip thread", "community thread"],
    responses: [
      "Threads are Print Cosmos's community currency! You earn them by helping other makers, posting in forums, getting upvotes on your designs, and participating in clubs. You can spend Threads on premium features, advertising your listings, or tipping other creators whose work you appreciate.",
      "There are several ways to earn Threads daily: 1) Post in forums and get upvotes (more engagement = more threads), 2) Help in the community by answering questions or reviewing designs, 3) Create and sell listings (a percentage of your revenue comes in as Threads), 4) Complete daily challenges found in the dashboard, 5) Join clubs and participate in club activities.",
      "Your Thread balance is displayed in your profile and in the navbar. Spending Threads on listing boosts, premium features, or tips is instant — the threads go directly to the recipient or the feature they're funding.",
    ],
  },

  pro: {
    keywords: ["pro", "subscription", "pro tier", "pro plan", "paid", "premium", "upgrade", "membership", "subscriber", "paid features"],
    responses: [
      "Print Cosmos Pro is our premium subscription that unlocks advanced features for makers and clubs! Benefits include: higher listing limits, priority marketplace visibility, reduced commission rates, access to premium thread colors and materials, club subscription management for recurring revenue, and expanded analytics for your store.",
      "To see what Pro includes or subscribe: 1) Go to your Dashboard, 2) Look for the 'Pro' section or 'Upgrade' button in the sidebar, 3) Choose your plan (monthly or annual), 4) Checkout using Stripe or PayPal — your Pro benefits activate instantly after payment!",
      "Pro subscribers also get a custom Pro Nova avatar with a gold rim accessory visible across the platform, and a badge on their profile showing their Pro status.",
    ],
  },

  messaging: {
    keywords: ["message", "chat", "dm", "direct message", "conversation", "talk", "contact", "reach out", "communicate", "contact seller", "message maker"],
    responses: [
      "You can message other makers directly through the platform! Click on any seller's profile and use the 'Message' button to start a conversation, or use the Messages tab in the navigation bar to see all your conversations at a glance. Messages are organized by thread so you can keep track of multiple conversations.",
      "You can also use the Discovery Clubs feature to join maker communities, participate in group chats, and connect with like-minded creators! Clubs have their own message streams separate from your personal DMs, so you can share work-in-progress, get feedback, and collaborate with other members.",
      "To get help from Print Cosmos support: look for the '⚠️' button in the chat sidebar when you have questions about platform features, orders, or issues. Our support team monitors incoming messages and responds typically within a few hours during business days.",
      "For urgent concerns about an order — like a missing or damaged print — use the 'Contact Seller' button on the order page. This flags the message as priority and notifies the seller directly.",
    ],
  },

  clubs: {
    keywords: ["club", "clubs", "discovery club", "membership club", "subscription club", "store subscription", "creator club", "owner club", "join club", "create club"],
    responses: [
      "Discovery Clubs are Print Cosmos's subscription-based maker communities! Sellers can create their own clubs and set membership tiers with different price points and benefits. Buyers subscribe to clubs to support their favorite makers and get exclusive access to new designs, discounts, and community perks.",
      "To join a club: browse the Discovery Clubs area on the marketplace, find a club that interests you, click 'Join' and choose your membership tier. You'll get immediate access to club-exclusive designs, pricing, and community features.",
      "To create a club: go to your Dashboard, click 'Create Club', set up your club name, description, pricing tiers, and membership benefits. Once published, other users can discover and join your club from the Discovery Clubs section!",
      "Club subscriptions can be monthly or annual, and you set the recurring price per tier. Clubs are a powerful way to build a recurring revenue stream and create a community around your work.",
    ],
  },

  troubleshooting: {
    keywords: ["problem", "issue", "bug", "not working", "broken", "error", "not printing", "failed", "print failed", "warp", "warping", "stringing", "blob", "gap", "layer shift", "curl", "detach", "stuck", "won't stick", "rough", "blobby", "under-extrusion", "over-extrusion", "extrusion", "squished", "stringing", "ooz", "fuzzy", "noisy"],
    responses: [
      "Print failures are frustrating but they're part of the learning process! Common causes and fixes: 1) Bed adhesion issues — clean your bed with isopropyl alcohol, lower your first-layer temperature by 5°C, or try a glue stick, 2) Stringing — increase retraction distance (1-2mm) or enable 'combing' mode in your slicer, 3) Layer shifting — check that your belts are tight and your hotend tightener isn't loose, 4) Under-extrusion — clean your nozzle (heat it and use a needle to clear any debris) and verify your filament isn't tangled on the spool.",
      "If your model keeps failing at the same spot, try reducing your print speed by 20–30%. Also check your slicer settings — too much infill or too thin walls can cause structural failures. A good starting point is: 20% infill, 3-4 perimeters (walls), and 0.2mm layer height for most prints.",
      "Temperature troubleshooting: if your print is stringing or oozing, reduce the hotend temp by 5°C and try again. If layers aren't bonding well, increase the temp by 5°C. Finding the right temperature for your filament can take a few tries — keep notes on what works!",
      "When all else fails, the Print Cosmos community is here to help! Post in the forums with details about your printer, filament, settings, and what went wrong — a fellow maker can likely spot the issue quickly.",
    ],
  },

  about_bob: {
    keywords: ["who are you", "what are you", "bob", "yourself", "about", "what is bob", "bob who", "tell me about"],
    responses: [
      "I'm Nova — Print Cosmos's onboard AI helper! I live in the platform's starfield background and I'm here to guide makers through everything they need to know about 3D printing and the Print Cosmos marketplace. Ask me about nozzles, infill, supports, filament types, how to list a design, club subscriptions, or anything else!",
      "Hi, I'm Nova, your Print Cosmos AI companion! I can help you with: 3D printing basics (nozzle, infill, supports, materials), platform features (design studio, threads, Pro, clubs, messaging), and troubleshooting common print issues. Just ask!",
    ],
  },

  default_response: {
    keywords: [],  // catches everything else
    responses: [
      "Hmm, that's outside my current knowledge base. I'm Nova, Print Cosmos's AI helper — I specialize in 3D printing questions and platform navigation. Try asking about infill, nozzles, supports, materials, the Design Studio, thread earning, Pro features, clubs, or listing on the marketplace!",
      "I'm still learning about that topic! My expertise is 3D printing and Print Cosmos platform features. Here's what I can help with: nozzle and bed basics, infill and support structures, filament materials (PLA/PETG/ABS/TPU), the Design Studio, Threads/Pro/Clubs, messaging, and troubleshooting print issues.",
      "That's a great question! Unfortunately I don't have a detailed answer for it yet — but it might be covered in our community forums. The Design Studio, Clubs, and maker community are packed with knowledge from experienced printers who love to share!",
    ],
  },
};