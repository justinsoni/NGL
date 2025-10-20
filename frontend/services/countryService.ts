export interface Country {
  name: {
    common: string;
    official: string;
  };
  cca2: string; // 2-letter country code
  cca3: string; // 3-letter country code
  flag: string; // emoji flag
}

export interface CountryOption {
  name: string;
  code: string;
  flag: string;
}

class CountryService {
  private countries: CountryOption[] = [];
  private isLoaded = false;
  private loadPromise: Promise<CountryOption[]> | null = null;

  async getCountries(): Promise<CountryOption[]> {
    if (this.isLoaded) {
      return this.countries;
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this.fetchCountries();
    return this.loadPromise;
  }

  private async fetchCountries(): Promise<CountryOption[]> {
    try {
      const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,flag');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch countries: ${response.status}`);
      }

      const countries: Country[] = await response.json();
      
      this.countries = countries
        .map(country => ({
          name: country.name.common,
          code: country.cca2,
          flag: country.flag
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      this.isLoaded = true;
      return this.countries;
    } catch (error) {
      console.error('Error fetching countries:', error);
      // Fallback to a basic list of common countries
      this.countries = this.getFallbackCountries();
      this.isLoaded = true;
      return this.countries;
    }
  }

  private getFallbackCountries(): CountryOption[] {
    return [
      { name: 'United States', code: 'US', flag: '🇺🇸' },
      { name: 'United Kingdom', code: 'GB', flag: '🇬🇧' },
      { name: 'Canada', code: 'CA', flag: '🇨🇦' },
      { name: 'Australia', code: 'AU', flag: '🇦🇺' },
      { name: 'Germany', code: 'DE', flag: '🇩🇪' },
      { name: 'France', code: 'FR', flag: '🇫🇷' },
      { name: 'Spain', code: 'ES', flag: '🇪🇸' },
      { name: 'Italy', code: 'IT', flag: '🇮🇹' },
      { name: 'Brazil', code: 'BR', flag: '🇧🇷' },
      { name: 'Argentina', code: 'AR', flag: '🇦🇷' },
      { name: 'Netherlands', code: 'NL', flag: '🇳🇱' },
      { name: 'Belgium', code: 'BE', flag: '🇧🇪' },
      { name: 'Portugal', code: 'PT', flag: '🇵🇹' },
      { name: 'Norway', code: 'NO', flag: '🇳🇴' },
      { name: 'Sweden', code: 'SE', flag: '🇸🇪' },
      { name: 'Denmark', code: 'DK', flag: '🇩🇰' },
      { name: 'Poland', code: 'PL', flag: '🇵🇱' },
      { name: 'Czech Republic', code: 'CZ', flag: '🇨🇿' },
      { name: 'Croatia', code: 'HR', flag: '🇭🇷' },
      { name: 'Serbia', code: 'RS', flag: '🇷🇸' },
      { name: 'Turkey', code: 'TR', flag: '🇹🇷' },
      { name: 'Russia', code: 'RU', flag: '🇷🇺' },
      { name: 'Ukraine', code: 'UA', flag: '🇺🇦' },
      { name: 'Japan', code: 'JP', flag: '🇯🇵' },
      { name: 'South Korea', code: 'KR', flag: '🇰🇷' },
      { name: 'China', code: 'CN', flag: '🇨🇳' },
      { name: 'India', code: 'IN', flag: '🇮🇳' },
      { name: 'Mexico', code: 'MX', flag: '🇲🇽' },
      { name: 'Egypt', code: 'EG', flag: '🇪🇬' },
      { name: 'Nigeria', code: 'NG', flag: '🇳🇬' },
      { name: 'South Africa', code: 'ZA', flag: '🇿🇦' },
      { name: 'Morocco', code: 'MA', flag: '🇲🇦' },
      { name: 'Algeria', code: 'DZ', flag: '🇩🇿' },
      { name: 'Tunisia', code: 'TN', flag: '🇹🇳' },
      { name: 'Senegal', code: 'SN', flag: '🇸🇳' },
      { name: 'Ghana', code: 'GH', flag: '🇬🇭' },
      { name: 'Ivory Coast', code: 'CI', flag: '🇨🇮' },
      { name: 'Cameroon', code: 'CM', flag: '🇨🇲' },
      { name: 'Kenya', code: 'KE', flag: '🇰🇪' },
      { name: 'Ethiopia', code: 'ET', flag: '🇪🇹' },
      { name: 'Uganda', code: 'UG', flag: '🇺🇬' },
      { name: 'Tanzania', code: 'TZ', flag: '🇹🇿' },
      { name: 'Zimbabwe', code: 'ZW', flag: '🇿🇼' },
      { name: 'Zambia', code: 'ZM', flag: '🇿🇲' },
      { name: 'Botswana', code: 'BW', flag: '🇧🇼' },
      { name: 'Namibia', code: 'NA', flag: '🇳🇦' },
      { name: 'Angola', code: 'AO', flag: '🇦🇴' },
      { name: 'Mozambique', code: 'MZ', flag: '🇲🇿' },
      { name: 'Madagascar', code: 'MG', flag: '🇲🇬' },
      { name: 'Mauritius', code: 'MU', flag: '🇲🇺' },
      { name: 'Seychelles', code: 'SC', flag: '🇸🇨' },
      { name: 'Comoros', code: 'KM', flag: '🇰🇲' },
      { name: 'Djibouti', code: 'DJ', flag: '🇩🇯' },
      { name: 'Somalia', code: 'SO', flag: '🇸🇴' },
      { name: 'Eritrea', code: 'ER', flag: '🇪🇷' },
      { name: 'Sudan', code: 'SD', flag: '🇸🇩' },
      { name: 'South Sudan', code: 'SS', flag: '🇸🇸' },
      { name: 'Central African Republic', code: 'CF', flag: '🇨🇫' },
      { name: 'Chad', code: 'TD', flag: '🇹🇩' },
      { name: 'Niger', code: 'NE', flag: '🇳🇪' },
      { name: 'Mali', code: 'ML', flag: '🇲🇱' },
      { name: 'Burkina Faso', code: 'BF', flag: '🇧🇫' },
      { name: 'Guinea', code: 'GN', flag: '🇬🇳' },
      { name: 'Sierra Leone', code: 'SL', flag: '🇸🇱' },
      { name: 'Liberia', code: 'LR', flag: '🇱🇷' },
      { name: 'Guinea-Bissau', code: 'GW', flag: '🇬🇼' },
      { name: 'Cape Verde', code: 'CV', flag: '🇨🇻' },
      { name: 'Gambia', code: 'GM', flag: '🇬🇲' },
      { name: 'Mauritania', code: 'MR', flag: '🇲🇷' },
      { name: 'Malawi', code: 'MW', flag: '🇲🇼' },
      { name: 'Lesotho', code: 'LS', flag: '🇱🇸' },
      { name: 'Swaziland', code: 'SZ', flag: '🇸🇿' },
      { name: 'Rwanda', code: 'RW', flag: '🇷🇼' },
      { name: 'Burundi', code: 'BI', flag: '🇧🇮' },
      { name: 'Democratic Republic of the Congo', code: 'CD', flag: '🇨🇩' },
      { name: 'Republic of the Congo', code: 'CG', flag: '🇨🇬' },
      { name: 'Gabon', code: 'GA', flag: '🇬🇦' },
      { name: 'Equatorial Guinea', code: 'GQ', flag: '🇬🇶' },
      { name: 'São Tomé and Príncipe', code: 'ST', flag: '🇸🇹' },
      { name: 'Central African Republic', code: 'CF', flag: '🇨🇫' },
      { name: 'Chad', code: 'TD', flag: '🇹🇩' },
      { name: 'Niger', code: 'NE', flag: '🇳🇪' },
      { name: 'Mali', code: 'ML', flag: '🇲🇱' },
      { name: 'Burkina Faso', code: 'BF', flag: '🇧🇫' },
      { name: 'Guinea', code: 'GN', flag: '🇬🇳' },
      { name: 'Sierra Leone', code: 'SL', flag: '🇸🇱' },
      { name: 'Liberia', code: 'LR', flag: '🇱🇷' },
      { name: 'Guinea-Bissau', code: 'GW', flag: '🇬🇼' },
      { name: 'Cape Verde', code: 'CV', flag: '🇨🇻' },
      { name: 'Gambia', code: 'GM', flag: '🇬🇲' },
      { name: 'Mauritania', code: 'MR', flag: '🇲🇷' },
      { name: 'Malawi', code: 'MW', flag: '🇲🇼' },
      { name: 'Lesotho', code: 'LS', flag: '🇱🇸' },
      { name: 'Swaziland', code: 'SZ', flag: '🇸🇿' },
      { name: 'Rwanda', code: 'RW', flag: '🇷🇼' },
      { name: 'Burundi', code: 'BI', flag: '🇧🇮' },
      { name: 'Democratic Republic of the Congo', code: 'CD', flag: '🇨🇩' },
      { name: 'Republic of the Congo', code: 'CG', flag: '🇨🇬' },
      { name: 'Gabon', code: 'GA', flag: '🇬🇦' },
      { name: 'Equatorial Guinea', code: 'GQ', flag: '🇬🇶' },
      { name: 'São Tomé and Príncipe', code: 'ST', flag: '🇸🇹' }
    ].sort((a, b) => a.name.localeCompare(b.name));
  }

  searchCountries(query: string): CountryOption[] {
    if (!query) return this.countries;
    
    const lowercaseQuery = query.toLowerCase();
    return this.countries.filter(country => 
      country.name.toLowerCase().includes(lowercaseQuery)
    );
  }
}

export const countryService = new CountryService();
