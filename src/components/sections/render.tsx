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
}: {
  section: SectionRow;
  settings: SiteSettings | null;
  first: boolean;
}) {
  const labels = makeLabels(settings);
  const { type, content } = section;

  switch (type) {
    case "hero":
      return <HeroSection content={content} first={first} />;

    case "collections":
      return <CollectionsSection content={content} collections={await getCollections()} labels={labels} />;

    case "bestsellers":
      return (
        <ProductsSection
          content={content}
          products={await getBestsellers(num(obj(content).limit))}
          labels={labels}
        />
      );

    case "looks":
      return <LooksSection content={content} looks={await getLooks()} labels={labels} />;

    case "try_on_feature":
      return <TryOnFeatureSection content={content} />;

    case "brand_story":
    case "image_text":
      return <ImageTextSection content={content} />;

    case "craft":
      return <CraftSection content={content} />;

    case "testimonials":
      return <TestimonialsSection content={content} testimonials={await getTestimonials()} />;

    case "press":
      return <PressSection content={content} logos={await getPressLogos()} />;

    case "newsletter":
      return <NewsletterSection content={content} errorMessage={labels.t("form_error_save")} />;

    case "rich_text":
      return <RichTextSection content={content} />;

    case "contact_details":
      return <ContactDetailsSection content={content} settings={settings} />;

    case "contact_form":
      return <ContactFormSection content={content} errorMessage={labels.t("form_error_send")} />;

    default:
      return null;
  }
}

/** Renders a page's visible sections in their saved order. */
export function RenderSections({
  sections,
  settings,
}: {
  sections: SectionRow[];
  settings: SiteSettings | null;
}) {
  return (
    <>
      {sections.map((section, index) => (
        <RenderSection key={section.id} section={section} settings={settings} first={index === 0} />
      ))}
    </>
  );
}
