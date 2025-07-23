import { Instagram, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";

const Footer = () => {
  const footerSections = [
    {
      title: "Our Community",
      links: [
        "Young Founders League",
        "Chapters", 
        "Campus Ambassadors",
        "Alumni",
        "Advisors",
        "Partners"
      ]
    },
    {
      title: "Events",
      links: [
        "Young Founders Floor",
        "Annual Retreat",
        "Webinars",
        "Women Founders Meetup"
      ]
    },
    {
      title: "Insights",
      links: [
        "Blogs",
        "Newsletter",
        "Careers"
      ]
    }
  ];

  const legalLinks = [
    "Home",
    "Terms of Service",
    "Privacy Policy", 
    "Code of Conduct",
    "Contact Us"
  ];

  return (
    <footer className="bg-background border-t border-border py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Logo and Legal Links */}
          <div className="md:col-span-1">
            <div className="flex items-center mb-6">
              <img 
                src="/lovable-uploads/72856c44-6ead-48de-8838-a00fe8990bad.png" 
                alt="26ideas Young Founders" 
                className="h-8 w-auto"
              />
            </div>
            
            <div className="space-y-3">
              {legalLinks.map((link) => (
                <div key={link}>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm block"
                  >
                    {link}
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Sections */}
          {footerSections.map((section) => (
            <div key={section.title} className="md:col-span-1">
              <h3 className="font-semibold text-foreground mb-4 uppercase tracking-wide text-sm">
                {section.title}
              </h3>
              <div className="space-y-3">
                {section.links.map((link) => (
                  <div key={link}>
                    <a
                      href="#"
                      className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm block"
                    >
                      {link}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Social Media and N8N Button */}
          <div className="md:col-span-1 flex md:justify-end">
            <div className="flex flex-col space-y-4">
              <div className="flex space-x-4">
                <a
                  href="#"
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a
                  href="https://www.linkedin.com/company/26ideas/?viewAsMember=true"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
              </div>
              <Button variant="outline" size="sm">
                N8N
              </Button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;