import { HeroSection } from "./hero";
import {
  CollectionsSection,
  CraftSection,
  ImageTextSection,
  LooksSection,
  PressSection,
  ProductsSection,
  RichTextSection,
  TestimonialsSection,
  TryOnFeatureSection,
} from "./editorial";
import { NewsletterSection } from "./newsletter";
import { ContactFormSection } from "./contact";
import { ContactDetailsSection } from "./contact-details";
import {
  getBestsellers,
  getCollections,
  getLooks,
  getPressLogos,
  getTestimonials,
  type SectionRow,
  type SiteSettings,
} from "@/lib/content";
import { makeLabels } from "@/lib/labels";
import { num, obj } from "@/lib/section-content";

/**
 * Renders one section by type.
 *
 * Sections that list rows from another table fetch their own data, so adding a
 * section in the admin panel is enough — no route has to be taught about it.
 * An unknown type renders nothing rather than breaking the page, which matters
 * because the database can gain a section type before the renderer exists.
 */
export async function RenderSection({
  section,
  settings,
  first,
  headingLevel = 2,
}: {
  section: SectionRow;
  settings: SiteSettings | null;
  first: boolean;
  /** 1 when this section carries the page's title — see RenderSections. */
  headingLevel?: 1 | 2;
}) {
  const labels = makeLabels(settings);
  const { type, content } = section;

  switch (type) {
    case "hero":
      return <HeroSection content={content} first={first} />;

    case "collections":
      return <CollectionsSection headingLevel={headingLevel} content={content} collections={await getCollections()} labels={labels} />;

    case "bestsellers":
      return (
        <ProductsSection headingLevel={headingLevel}
          content={content}
          products={await getBestsellers(num(obj(content).limit))}
          labels={labels}
        />
      );

    case "looks":
      return <LooksSection headingLevel={headingLevel} content={content} looks={await getLooks()} labels={labels} />;

    case "try_on_feature":
      return <TryOnFeatureSection headingLevel={headingLevel} content={content} />;

    case "brand_story":
    case "image_text":
      return <ImageTextSection headingLevel={headingLevel} content={content} />;

    case "craft":
      return <CraftSection headingLevel={headingLevel} content={content} />;

    case "testimonials":
      return <TestimonialsSection headingLevel={headingLevel} content={content} testimonials={await getTestimonials()} />;

    case "press":
      return <PressSection headingLevel={headingLevel} content={content} logos={await getPressLogos()} />;

    case "newsletter":
      return <NewsletterSection content={content} errorMessage={labels.t("form_error_save")} />;

    case "rich_text":
      return <RichTextSection headingLevel={headingLevel} content={content} />;

    case "contact_details":
      return <ContactDetailsSection content={content} settings={settings} />;

    case "contact_form":
      return <ContactFormSection content={content} errorMessage={labels.t("form_error_send")} />;

    default:
      return null;
  }
}

/**
 * Renders a page's visible sections in their saved order.
 *
 * Only a hero emits an h1, so a page built from text sections alone had none
 * at all — every policy page was like this. Where there is no hero, the first
 * section that can show a headline carries the page's h1 instead. A page
 * without an h1 is a real defect for anyone navigating by headings.
 */
export function RenderSections({
  sections,
  settings,
}: {
  sections: SectionRow[];
  settings: SiteSettings | null;
}) {
  const hasHero = sections.some((s) => s.type === "hero");
  const titleIndex = hasHero ? -1 : sections.findIndex((s) => s.type !== "newsletter");

  return (
    <>
      {sections.map((section, index) => (
        <RenderSection
          key={section.id}
          section={section}
          settings={settings}
          first={index === 0}
          headingLevel={index === titleIndex ? 1 : 2}
        />
      ))}
    </>
  );
}
