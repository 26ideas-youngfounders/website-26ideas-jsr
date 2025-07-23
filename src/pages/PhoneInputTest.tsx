/**
 * @fileoverview Test page for PhoneInput component
 * 
 * This page demonstrates the functionality of the PhoneInput component
 * with country code dropdown and flag support.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import { useState } from "react";
import { PhoneInput } from "@/components/ui/phone-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * PhoneInputTest Component
 * 
 * Demonstrates the PhoneInput component functionality including:
 * - Country code selection with flags
 * - Phone number validation
 * - Form integration
 * - Error handling
 * 
 * @returns {JSX.Element} The test page component
 */
const PhoneInputTest = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [countryIsoCode, setCountryIsoCode] = useState("IN");
  const [error, setError] = useState("");

  /**
   * Handles form submission to test phone input validation
   */
  const handleSubmit = () => {
    if (!phoneNumber) {
      setError("Phone number is required");
      return;
    }
    
    if (phoneNumber.length < 10) {
      setError("Phone number must be at least 10 digits");
      return;
    }

    setError("");
    alert(`Phone submitted: ${countryCode} ${phoneNumber} (${countryIsoCode})`);
  };

  /**
   * Handles country selection change
   */
  const handleCountryChange = (newCountryCode: string, newIsoCode: string) => {
    setCountryCode(newCountryCode);
    setCountryIsoCode(newIsoCode);
    setError(""); // Clear error when country changes
  };

  /**
   * Handles phone number input change
   */
  const handlePhoneChange = (newPhoneNumber: string) => {
    setPhoneNumber(newPhoneNumber);
    setError(""); // Clear error when phone changes
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>📱 Phone Input Component Test</CardTitle>
            <CardDescription>
              Test the PhoneInput component with country code dropdown and flag support.
              Default selection is India (+91 🇮🇳).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Main Phone Input Test */}
            <div>
              <PhoneInput
                label="Test Phone Number"
                value={phoneNumber}
                onChange={handlePhoneChange}
                countryCode={countryCode}
                countryIsoCode={countryIsoCode}
                onCountryChange={handleCountryChange}
                required
                error={error}
                placeholder="Enter your phone number"
              />
            </div>

            {/* Current Values Display */}
            <div className="space-y-2">
              <h3 className="font-semibold">Current Values:</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  Country Code: {countryCode}
                </Badge>
                <Badge variant="outline">
                  ISO Code: {countryIsoCode}
                </Badge>
                <Badge variant="outline">
                  Phone: {phoneNumber || "(empty)"}
                </Badge>
              </div>
            </div>

            {/* Submit Button */}
            <Button onClick={handleSubmit} className="w-full">
              Test Submit
            </Button>

            {/* Test Cases */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Test Cases to Try:</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Search for "United States" or "US" in the dropdown</li>
                <li>• Try different country codes (+1, +44, +91, etc.)</li>
                <li>• Enter invalid phone numbers (less than 10 digits)</li>
                <li>• Test responsive design on mobile</li>
                <li>• Verify flag emojis display correctly</li>
                <li>• Check keyboard navigation in dropdown</li>
              </ul>
            </div>

            {/* Demo Values */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Quick Test Values:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setCountryCode("+91");
                    setCountryIsoCode("IN");
                    setPhoneNumber("9876543210");
                  }}
                >
                  🇮🇳 India Example
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setCountryCode("+1");
                    setCountryIsoCode("US");
                    setPhoneNumber("5551234567");
                  }}
                >
                  🇺🇸 US Example
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setCountryCode("+44");
                    setCountryIsoCode("GB");
                    setPhoneNumber("7911123456");
                  }}
                >
                  🇬🇧 UK Example
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setPhoneNumber("");
                    setError("");
                  }}
                >
                  Clear All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Details */}
        <Card>
          <CardHeader>
            <CardTitle>Technical Implementation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-2">
              <p><strong>Database Schema:</strong> country_codes table with flag emojis</p>
              <p><strong>Validation:</strong> Real-time phone number format checking</p>
              <p><strong>Accessibility:</strong> ARIA labels and keyboard navigation</p>
              <p><strong>Responsive:</strong> Mobile-first design with proper touch targets</p>
              <p><strong>Search:</strong> Type to search countries by name or code</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PhoneInputTest;