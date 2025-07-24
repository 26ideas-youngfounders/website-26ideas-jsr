
/**
 * @fileoverview PhoneInput component with country code dropdown and flags
 * 
 * A comprehensive phone number input component that includes:
 * - Country code selection dropdown with flags
 * - Searchable country list loaded from database
 * - Mobile number validation
 * - Default selection to India (+91 🇮🇳)
 * - Responsive design for mobile and desktop
 * - Error handling and fallbacks for missing flags
 * 
 * @version 2.0.0
 * @author 26ideas Development Team
 */

import React, { useState, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";

/**
 * Interface for country code data from the database
 */
interface CountryCode {
  country_id: string;
  country_name: string;
  country_code: string;
  iso_code: string;
  country_flag_emoji: string;
  is_active: boolean;
}

/**
 * Props interface for the PhoneInput component
 */
interface PhoneInputProps {
  /** Current phone number value (without country code) */
  value?: string;
  /** Callback when phone number changes */
  onChange?: (phoneNumber: string) => void;
  /** Current selected country code */
  countryCode?: string;
  /** Current selected country ISO code */
  countryIsoCode?: string;
  /** Callback when country selection changes */
  onCountryChange?: (countryCode: string, isoCode: string) => void;
  /** Whether the input is required */
  required?: boolean;
  /** Error message to display */
  error?: string;
  /** Input placeholder text */
  placeholder?: string;
  /** Input label */
  label?: string;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * PhoneInput Component
 * 
 * Renders a phone input with country code dropdown featuring:
 * - Flag emojis for visual country identification
 * - Searchable dropdown for easy country selection
 * - Proper validation and error handling
 * - Accessibility support
 * - Responsive design
 * 
 * @param props - PhoneInput component props
 * @returns JSX.Element - The complete phone input component
 */
export const PhoneInput: React.FC<PhoneInputProps> = ({
  value = "",
  onChange,
  countryCode = "+91",
  countryIsoCode = "IN", 
  onCountryChange,
  required = false,
  error,
  placeholder = "Enter phone number",
  label = "Phone Number",
  disabled = false,
  className,
}) => {
  // State management
  const [countries, setCountries] = useState<CountryCode[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  /**
   * Fetches country codes from the database on component mount
   * Includes error handling and loading state management
   */
  useEffect(() => {
    const fetchCountryCodes = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('country_codes')
          .select('*')
          .eq('is_active', true)
          .order('country_name');

        if (error) {
          console.error('❌ Error fetching country codes:', error);
          return;
        }

        if (data && data.length > 0) {
          setCountries(data);
          console.log(`✅ Loaded ${data.length} countries from database`);
          
          // Check for missing flag emojis and log warnings
          const missingFlags = data.filter(country => 
            !country.country_flag_emoji || country.country_flag_emoji.trim() === ''
          );
          
          if (missingFlags.length > 0) {
            console.warn('⚠️ Countries with missing flag emojis:', 
              missingFlags.map(c => `${c.country_name} (${c.country_code})`).join(', ')
            );
          }
        } else {
          console.warn('⚠️ No country codes found in database');
        }
      } catch (error) {
        console.error('❌ Error fetching country codes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCountryCodes();
  }, []);

  /**
   * Finds the currently selected country based on country code and ISO code
   */
  const selectedCountry = countries.find(
    country => country.country_code === countryCode && country.iso_code === countryIsoCode
  );

  /**
   * Filters countries based on search query
   * Searches both country name and country code
   */
  const filteredCountries = countries.filter(country =>
    country.country_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.country_code.includes(searchQuery)
  );

  /**
   * Handles country selection from dropdown
   * Updates both country code and ISO code
   * 
   * @param country - Selected country object
   */
  const handleCountrySelect = (country: CountryCode) => {
    onCountryChange?.(country.country_code, country.iso_code);
    setIsOpen(false);
    setSearchQuery("");
  };

  /**
   * Handles phone number input changes
   * Only allows numeric input and common phone number characters
   * 
   * @param e - Input change event
   */
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Allow only numbers, spaces, hyphens, and parentheses
    const sanitizedValue = inputValue.replace(/[^0-9\s\-\(\)]/g, '');
    onChange?.(sanitizedValue);
  };

  /**
   * Renders country flag with fallback
   * 
   * @param country - Country object
   * @returns JSX element with flag or fallback
   */
  const renderCountryFlag = (country: CountryCode) => {
    if (country.country_flag_emoji && country.country_flag_emoji.trim() !== '') {
      return <span className="text-lg">{country.country_flag_emoji}</span>;
    } else {
      // Fallback to country ISO code if flag is missing
      console.warn(`⚠️ Missing flag emoji for ${country.country_name}, using ISO code fallback`);
      return (
        <span className="text-xs font-mono bg-muted px-1 py-0.5 rounded">
          {country.iso_code}
        </span>
      );
    }
  };

  if (loading) {
    return (
      <div className={cn("space-y-2", className)}>
        {label && (
          <Label className="text-sm font-medium">
            {label} {required && <span className="text-destructive">*</span>}
          </Label>
        )}
        <div className="flex">
          <div className="w-32 h-10 bg-muted animate-pulse rounded-l-md" />
          <div className="flex-1 h-10 bg-muted animate-pulse rounded-r-md" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Input Label */}
      {label && (
        <Label className="text-sm font-medium">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      )}

      <div className="flex">
        {/* Country Code Dropdown */}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={isOpen}
              aria-label="Select country code"
              className={cn(
                "w-auto min-w-[140px] justify-between rounded-r-none border-r-0 bg-background",
                error && "border-destructive",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              disabled={disabled}
            >
              <div className="flex items-center gap-2">
                {selectedCountry ? (
                  <>
                    {renderCountryFlag(selectedCountry)}
                    <span className="text-sm font-medium">{selectedCountry.country_code}</span>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">Select</span>
                )}
              </div>
              <ChevronDown className={cn(
                "ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform duration-200",
                isOpen && "rotate-180"
              )} />
            </Button>
          </PopoverTrigger>

          <PopoverContent 
            className="w-[320px] p-0 bg-background border border-border shadow-lg z-50" 
            align="start"
          >
            <Command>
              <div className="flex items-center border-b px-3">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <CommandInput
                  placeholder="Search countries..."
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              
              <CommandList>
                <CommandEmpty>No countries found.</CommandEmpty>
                <CommandGroup className="max-h-[200px] overflow-auto">
                  {filteredCountries.map((country) => (
                    <CommandItem
                      key={`${country.country_code}-${country.iso_code}`}
                      value={`${country.country_name} ${country.country_code}`}
                      onSelect={() => handleCountrySelect(country)}
                      className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-accent"
                    >
                      {renderCountryFlag(country)}
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate">{country.country_name}</span>
                          <span className="text-sm text-muted-foreground ml-2">{country.country_code}</span>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Phone Number Input */}
        <Input
          type="tel"
          value={value}
          onChange={handlePhoneChange}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "rounded-l-none border-l-0 focus:border-l-0",
            error && "border-destructive focus:border-destructive",
            "flex-1"
          )}
          aria-invalid={!!error}
          aria-describedby={error ? "phone-error" : undefined}
        />
      </div>

      {/* Error Message */}
      {error && (
        <p id="phone-error" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
};
