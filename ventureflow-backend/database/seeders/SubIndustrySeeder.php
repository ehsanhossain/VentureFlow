<?php

/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */


namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
// If you have an Eloquent model for Industry, you could use it like:
use App\Models\Industry;

class SubIndustrySeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * This seeder populates the 'sub_industries' table with niche industries,
     * linking them to their parent broader categories in the 'industries' table.
     * It assumes that the 'IndustrySeeder' has already populated the 'industries' table.
     */
    public function run(): void
    {
        // Define the mapping of Broader Categories (Industries) to their Niche Industries (SubIndustries)
        $industryNicheMap = [
            'Agriculture, Forestry, Fishing, and Hunting' => [
                'Crop Production (e.g., Grain Farming, Vegetable Farming)',
                'Animal Production (e.g., Cattle Ranching, Poultry Farming)',
                'Forestry and Logging (e.g., Timber Tract Operations)',
                'Fishing (Excluding Aquaculture)',
                'Aquaculture (e.g., Fish Farming)',
                'Agrochemicals Manufacturing (e.g., Fertilizers, Pesticides)',
                'Farm Machinery and Equipment Manufacturing',
                'Support Activities for Agriculture and Forestry (e.g., Soil Preparation, Crop Harvesting)',
                'Organic Farming',
                'Hydroponics and Vertical Farming',
            ],
            'Mining, Quarrying, and Oil and Gas Extraction' => [
                'Mining, Quarrying, Gravel Mining (e.g., Stone, Sand, Gravel)',
                'Oil and Gas Extraction',
                'Metal Ore Mining (e.g., Iron Ore, Gold Mining)',
                'Coal Mining',
                'Support Activities for Mining (e.g., Drilling Services)',
                'Rare Earth Mineral Mining',
                'Natural Gas Liquids Extraction',
            ],
            'Utilities' => [
                'Electricity, Gas, Heat Supply, and Water Supply',
                'Electric Power Generation (e.g., Solar, Wind, Hydroelectric)',
                'Natural Gas Distribution',
                'Water Supply and Irrigation Systems',
                'Renewable Energy Generation (e.g., Geothermal Energy)',
                'Smart Grid Technology Services',
            ],
            'Construction' => [
                'Construction of Buildings (e.g., Residential, Commercial)',
                'Heavy and Civil Engineering Construction (e.g., Highways, Bridges)',
                'Specialty Trade Contractors (e.g., Plumbing, Electrical Work)',
                'Green Building and Sustainable Construction',
                'Infrastructure Construction (e.g., Airports, Dams)',
                'Modular and Prefabricated Building Construction',
            ],
            'Waste Management and Remediation Services' => [
                'Waste Disposal (e.g., Waste Collection, Treatment)',
                'Recycling and Reclamation Services',
                'Hazardous Waste Treatment and Disposal',
                'Environmental Remediation Services (e.g., Soil Cleanup)',
                'Waste-to-Energy Conversion',
            ],
            'Manufacturing' => [
                'Food Manufacturing (e.g., Bakery Products, Dairy Processing)',
                'Beverage and Tobacco Product Manufacturing',
                'Textile Industry (e.g., Textile Mills, Fabric Finishing)',
                'Wood and Wood Product Manufacturing (e.g., Sawmills)',
                'Pulp, Paper, and Paper Processing Manufacturing',
                'Printing and Related Industries (e.g., Commercial Printing)',
                'Chemical Industry (e.g., Basic Chemicals, Specialty Chemicals)',
                'Petroleum and Coal Product Manufacturing',
                'Plastic Product Manufacturing',
                'Rubber Product Manufacturing',
                'Housing-Related Product Manufacturing (e.g., Modular Homes)',
                'Ceramics, Stone, and Clay Product Manufacturing',
                'Iron and Steel Industry (e.g., Steel Mills)',
                'Non-Ferrous Metal Manufacturing (e.g., Aluminum Production)',
                'Metal Product Manufacturing (e.g., Forging, Stamping)',
                'Production Machinery and Equipment Manufacturing',
                'Commercial Machinery and Equipment Manufacturing',
                'Electronic Parts, Devices, and Electronic Circuits Manufacturing',
                'Electrical Machinery and Equipment Manufacturing',
                'Sealants and Adhesives Manufacturing',
                'Medical Device Manufacturing (e.g., Surgical Instruments)',
                'Other Manufacturing (e.g., Jewelry Manufacturing)',
                'Aerospace Product and Parts Manufacturing',
                'Motor Vehicle Manufacturing',
                'Computer and Peripheral Equipment Manufacturing',
                'Semiconductor and Other Electronic Component Manufacturing',
                'Biotechnology Product Manufacturing (e.g., Vaccines)',
                '3D Printing Manufacturing',
                'Nanotechnology Manufacturing',
                'Battery Manufacturing for Electric Vehicles',
            ],
            'Information and Communications' => [
                'Publishing Industries (e.g., Newspaper, Book Publishing)',
                'IT & Tech Business (e.g., Software Publishers)',
                'Media Streaming Distribution Services (e.g., Video Streaming)',
                'Internet Publishing and Broadcasting (e.g., Web Portals)',
                'Telecommunications (e.g., Wireless Carriers)',
                'Data Processing, Hosting, and Related Services (e.g., Cloud Computing)',
                'Artificial Intelligence Development',
                'Blockchain Technology Providers',
                'Cybersecurity Services',
            ],
            'Transportation and Logistics' => [
                'Transportation and Postal Services (e.g., Air, Rail Transport)',
                'Warehousing and Storage',
                'Maritime & Shipping Line (e.g., Deep Sea Freight)',
                'Logistics and Supply Chain Management',
                'Freight Forwarding',
                'Urban Transit Systems (e.g., Bus, Subway Services)',
                'Drone Delivery Services',
            ],
            'Wholesale Trade' => [
                'Wholesale of Various Goods (e.g., Durable Goods)',
                'Wholesale of Food and Beverages',
                'Wholesale of Building Materials, Minerals, Metal Materials',
                'Wholesale of Machinery and Equipment',
                'Other Wholesale (e.g., Agricultural Products)',
                'E-Commerce Wholesalers (e.g., Online Wholesale Platforms)',
                'Pharmaceutical Wholesalers',
            ],
            'Retail Trade' => [
                'Retail of Various Goods (e.g., General Merchandise Stores)',
                'Retail of Textiles, Clothing, and Personal Items',
                'Retail of Food and Beverages (e.g., Supermarkets)',
                'Retail of Machinery and Equipment (e.g., Electronics Stores)',
                'Furniture & Lifestyle Goods (e.g., Home Furnishings)',
                'Other Retail (e.g., Pet Stores, Florists)',
                'E-Commerce (e.g., Online Retail)',
                'Mail-Order Houses',
                'Specialty Retail (e.g., Sporting Goods, Bookstores)',
            ],
            'Finance and Insurance' => [
                'Finance and Insurance (e.g., Banking, Insurance Carriers)',
                'Investment Banking',
                'Hedge Funds',
                'Fintech Services (e.g., Mobile Payment Platforms)',
                'Insurance Brokerage',
            ],
            'Real Estate and Rental' => [
                'Real Estate and Rental of Goods (e.g., Property Sales)',
                'Property Management',
                'Timeshare Condominium Associations',
                'Equipment Rental and Leasing (e.g., Construction Equipment)',
            ],
            'Professional, Scientific, and Technical Services' => [
                'Academic Research, Professional, and Technical Services',
                'Advertising (e.g., Digital Marketing)',
                'Solar Engineering',
                'Management Consulting Services',
                'Scientific Research and Development Services (e.g., Biotech R&D)',
                'Environmental Consulting Services',
            ],
            'Management of Companies and Enterprises' => [
                'Corporate Management and Holding Companies',
                'Franchise Management Services',
            ],
            'Administrative and Support Services' => [
                'Office Administrative Services',
                'Facilities Support Services (e.g., Janitorial Services)',
                'Security and Investigation Services',
            ],
            'Educational Services' => [
                'Education and Learning Support (e.g., Schools, Universities)',
                'Educational Support Services (e.g., Tutoring)',
                'Child Day Care Services',
                'Online Education Platforms',
            ],
            'Healthcare and Social Assistance' => [
                'Medical and Welfare (e.g., Hospitals, Clinics)',
                'Healthcare Technology / Medical Devices',
                'Home Health Care Services',
                'Community Food, Housing, and Emergency Services',
                'Telemedicine Services',
            ],
            'Arts, Entertainment, and Recreation' => [
                'Performing Arts and Spectator Sports',
                'Museums, Historical Sites, and Similar Institutions',
                'Amusement, Gambling, and Recreation Industries (e.g., Theme Parks)',
            ],
            'Accommodation and Food Services' => [
                'Restaurants (e.g., Full-Service, Fast Food)',
                'Hotel & Tourism (e.g., Hotels, Resorts)',
                'Casinos and Gambling',
                'Travel Arrangement and Reservation Services',
                'Catering Services',
            ],
            'Other Services' => [
                'Life-Related Services and Entertainment (e.g., Personal Care)',
                'Services (Not Elsewhere Classified) (e.g., Repair Services)',
                'Funeral Homes and Funeral Services',
                'Car Wash Services',
                'Pet Care Services (e.g., Veterinary Services)',
            ],
            'Public Administration' => [
                'Executive, Legislative, and General Government Support',
                'Justice, Public Order, and Safety Activities',
                'Administration of Environmental Quality Programs',
                'Space Research and Technology',
            ],
            'Unclassifiable Industries' => [
                // 'Unclassifiable Industries', // This might be redundant if the parent is 'Unclassifiable Industries'
                'International Organizations',
            ],
        ];

        // Iterate over the map
        foreach ($industryNicheMap as $industryName => $nicheIndustries) {
            // Find the parent industry by its name.
            // Using DB facade for direct query. Eloquent can also be used: Industry::where('name', $industryName)->first();
            $industry = DB::table('industries')->where('name', $industryName)->first();

            if ($industry) {
                // If the parent industry is found, iterate through its niche industries and insert them
                foreach ($nicheIndustries as $nicheName) {
                    DB::table('sub_industries')->insert([
                        'industry_id' => $industry->id,
                        'name' => $nicheName,
                        'status' => 1, // Default status, e.g., 1 for active
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            } else {
                // Optional: Output a warning to the console if a parent industry isn't found.
                // This can be helpful during development and debugging.
                if ($this->command) {
                    $this->command->warn("Parent industry not found: '{$industryName}'. Sub-industries for it were not seeded.");
                }
            }
        }
    }
}
