<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CountrySeeder extends Seeder
{
    public function run(): void
    {
        $countries = [
            [
                'name' => 'Afghanistan',
                'alpha_2_code' => 'AF',
                'alpha_3_code' => 'AFG',
                'numeric_code' => 4,
                'svg_icon' => 'af.svg',
                'created_at' => '2025-04-24 06:44:03',
                'updated_at' => '2025-04-24 06:44:03'
            ],
            [
                'name' => 'Albania',
                'alpha_2_code' => 'AL',
                'alpha_3_code' => 'ALB',
                'numeric_code' => 8,
                'svg_icon' => 'al.svg',
                'created_at' => '2025-04-24 06:44:03',
                'updated_at' => '2025-04-24 06:44:03'
            ],
            [
                'name' => 'Algeria',
                'alpha_2_code' => 'DZ',
                'alpha_3_code' => 'DZA',
                'numeric_code' => 12,
                'svg_icon' => 'dz.svg',
                'created_at' => '2025-04-24 06:44:03',
                'updated_at' => '2025-04-24 06:44:03'
            ],
            [
                'name' => 'American Samoa',
                'alpha_2_code' => 'AS',
                'alpha_3_code' => 'ASM',
                'numeric_code' => 16,
                'svg_icon' => 'as.svg',
                'created_at' => '2025-04-24 06:44:03',
                'updated_at' => '2025-04-24 06:44:03'
            ],
            [
                'name' => 'Andorra',
                'alpha_2_code' => 'AD',
                'alpha_3_code' => 'AND',
                'numeric_code' => 20,
                'svg_icon' => 'ad.svg',
                'created_at' => '2025-04-24 06:44:03',
                'updated_at' => '2025-04-24 06:44:03'
            ],
            [
                'name' => 'Angola',
                'alpha_2_code' => 'AO',
                'alpha_3_code' => 'AGO',
                'numeric_code' => 24,
                'svg_icon' => 'ao.svg',
                'created_at' => '2025-04-24 06:44:03',
                'updated_at' => '2025-04-24 06:44:03'
            ],
            [
                'name' => 'Anguilla',
                'alpha_2_code' => 'AI',
                'alpha_3_code' => 'AIA',
                'numeric_code' => 660,
                'svg_icon' => 'ai.svg',
                'created_at' => '2025-04-24 06:44:03',
                'updated_at' => '2025-04-24 06:44:03'
            ],
            [
                'name' => 'Antarctica',
                'alpha_2_code' => 'AQ',
                'alpha_3_code' => 'ATA',
                'numeric_code' => 10,
                'svg_icon' => 'aq.svg',
                'created_at' => '2025-04-24 06:44:03',
                'updated_at' => '2025-04-24 06:44:03'
            ],
            [
                'name' => 'Antigua and Barbuda',
                'alpha_2_code' => 'AG',
                'alpha_3_code' => 'ATG',
                'numeric_code' => 28,
                'svg_icon' => 'ag.svg',
                'created_at' => '2025-04-24 06:44:03',
                'updated_at' => '2025-04-24 06:44:03'
            ],
            [
                'name' => 'Argentina',
                'alpha_2_code' => 'AR',
                'alpha_3_code' => 'ARG',
                'numeric_code' => 32,
                'svg_icon' => 'ar.svg',
                'created_at' => '2025-04-24 06:44:03',
                'updated_at' => '2025-04-24 06:44:03'
            ],
            [
                'name' => 'Armenia',
                'alpha_2_code' => 'AM',
                'alpha_3_code' => 'ARM',
                'numeric_code' => 51,
                'svg_icon' => 'am.svg',
                'created_at' => '2025-04-24 06:44:03',
                'updated_at' => '2025-04-24 06:44:03'
            ],
            [
                'name' => 'Aruba',
                'alpha_2_code' => 'AW',
                'alpha_3_code' => 'ABW',
                'numeric_code' => 533,
                'svg_icon' => 'aw.svg',
                'created_at' => '2025-04-24 06:44:03',
                'updated_at' => '2025-04-24 06:44:03'
            ],
            [
                'name' => 'Australia',
                'alpha_2_code' => 'AU',
                'alpha_3_code' => 'AUS',
                'numeric_code' => 36,
                'svg_icon' => 'au.svg',
                'created_at' => '2025-04-24 06:44:03',
                'updated_at' => '2025-04-24 06:44:03'
            ],
            [
                'name' => 'Austria',
                'alpha_2_code' => 'AT',
                'alpha_3_code' => 'AUT',
                'numeric_code' => 40,
                'svg_icon' => 'at.svg',
                'created_at' => '2025-04-24 06:44:03',
                'updated_at' => '2025-04-24 06:44:03'
            ],
            [
                'name' => 'Azerbaijan',
                'alpha_2_code' => 'AZ',
                'alpha_3_code' => 'AZE',
                'numeric_code' => 31,
                'svg_icon' => 'az.svg',
                'created_at' => '2025-04-24 06:44:03',
                'updated_at' => '2025-04-24 06:44:03'
            ],
            [
                'name' => 'Bahamas (the)',
                'alpha_2_code' => 'BS',
                'alpha_3_code' => 'BHS',
                'numeric_code' => 44,
                'svg_icon' => 'bs.svg',
                'created_at' => '2025-04-24 06:44:03',
                'updated_at' => '2025-04-24 06:44:03'
            ],
            [
                'name' => 'Bahrain',
                'alpha_2_code' => 'BH',
                'alpha_3_code' => 'BHR',
                'numeric_code' => 48,
                'svg_icon' => 'bh.svg',
                'created_at' => '2025-04-24 06:44:03',
                'updated_at' => '2025-04-24 06:44:03'
            ],
            [
                'name' => 'Bangladesh',
                'alpha_2_code' => 'BD',
                'alpha_3_code' => 'BGD',
                'numeric_code' => 50,
                'svg_icon' => 'bd.svg',
                'created_at' => '2025-04-24 06:44:03',
                'updated_at' => '2025-04-24 06:44:03'
            ],
            [
                'name' => 'Barbados',
                'alpha_2_code' => 'BB',
                'alpha_3_code' => 'BRB',
                'numeric_code' => 52,
                'svg_icon' => 'bb.svg',
                'created_at' => '2025-04-24 06:44:03',
                'updated_at' => '2025-04-24 06:44:03'
            ],
            [
                'name' => 'Belarus',
                'alpha_2_code' => 'BY',
                'alpha_3_code' => 'BLR',
                'numeric_code' => 112,
                'svg_icon' => 'by.svg',
                'created_at' => '2025-04-24 06:44:03',
                'updated_at' => '2025-04-24 06:44:03'
            ],
            [
                'name' => 'Belgium',
                'alpha_2_code' => 'BE',
                'alpha_3_code' => 'BEL',
                'numeric_code' => 56,
                'svg_icon' => 'be.svg',
                'created_at' => '2025-04-24 06:44:03',
                'updated_at' => '2025-04-24 06:44:03'
            ],
            [
                'name' => 'Belize',
                'alpha_2_code' => 'BZ',
                'alpha_3_code' => 'BLZ',
                'numeric_code' => 84,
                'svg_icon' => 'bz.svg',
                'created_at' => '2025-04-24 06:44:03',
                'updated_at' => '2025-04-24 06:44:03'
            ],
            [
                'name' => 'Benin',
                'alpha_2_code' => 'BJ',
                'alpha_3_code' => 'BEN',
                'numeric_code' => 204,
                'svg_icon' => 'bj.svg',
                'created_at' => '2025-04-24 06:44:03',
                'updated_at' => '2025-04-24 06:44:03'
            ],
            [
                'name' => 'Bermuda',
                'alpha_2_code' => 'BM',
                'alpha_3_code' => 'BMU',
                'numeric_code' => 60,
                'svg_icon' => 'bm.svg',
                'created_at' => '2025-04-24 06:44:03',
                'updated_at' => '2025-04-24 06:44:03'
            ],
            [
                'name' => 'Bhutan',
                'alpha_2_code' => 'BT',
                'alpha_3_code' => 'BTN',
                'numeric_code' => 64,
                'svg_icon' => 'bt.svg',
                'created_at' => '2025-04-24 06:44:03',
                'updated_at' => '2025-04-24 06:44:03'
            ],
            [
                'name' => 'Bolivia (Plurinational State of)',
                'alpha_2_code' => 'BO',
                'alpha_3_code' => 'BOL',
                'numeric_code' => 68,
                'svg_icon' => 'bo.svg',
                'created_at' => '2025-04-24 06:44:03',
                'updated_at' => '2025-04-24 06:44:03'
            ],
            [
                'name' => 'Bonaire, Sint Eustatius and Saba',
                'alpha_2_code' => 'BQ',
                'alpha_3_code' => 'BES',
                'numeric_code' => 535,
                'svg_icon' => 'bq.svg',
                'created_at' => '2025-04-24 06:44:03',
                'updated_at' => '2025-04-24 06:44:03'
            ],
            [
                'name' => 'Bosnia and Herzegovina',
                'alpha_2_code' => 'BA',
                'alpha_3_code' => 'BIH',
                'numeric_code' => 70,
                'svg_icon' => 'ba.svg',
                'created_at' => '2025-04-24 06:44:03',
                'updated_at' => '2025-04-24 06:44:03'
            ],
            [
                'name' => 'Botswana',
                'alpha_2_code' => 'BW',
                'alpha_3_code' => 'BWA',
                'numeric_code' => 72,
                'svg_icon' => 'bw.svg',
                'created_at' => '2025-04-24 06:44:03',
                'updated_at' => '2025-04-24 06:44:03'
            ],
            [
                'name' => 'Bouvet Island',
                'alpha_2_code' => 'BV',
                'alpha_3_code' => 'BVT',
                'numeric_code' => 74,
                'svg_icon' => 'bv.svg',
                'created_at' => '2025-04-24 06:44:03',
                'updated_at' => '2025-04-24 06:44:03'
            ],
            [
                'name' => 'Brazil',
                'alpha_2_code' => 'BR',
                'alpha_3_code' => 'BRA',
                'numeric_code' => 76,
                'svg_icon' => 'br.svg',
                'created_at' => '2025-04-24 06:44:03',
                'updated_at' => '2025-04-24 06:44:03'
            ],
            [
                'name' => 'British Indian Ocean Territory',
                'alpha_2_code' => 'IO',
                'alpha_3_code' => 'IOT',
                'numeric_code' => 86,
                'svg_icon' => 'io.svg',
                'created_at' => '2025-04-24 06:44:18',
                'updated_at' => '2025-04-24 06:44:18'
            ],
            [
                'name' => 'Brunei Darussalam',
                'alpha_2_code' => 'BN',
                'alpha_3_code' => 'BRN',
                'numeric_code' => 96,
                'svg_icon' => 'bn.svg',
                'created_at' => '2025-04-24 06:44:18',
                'updated_at' => '2025-04-24 06:44:18'
            ],
            [
                'name' => 'Bulgaria',
                'alpha_2_code' => 'BG',
                'alpha_3_code' => 'BGR',
                'numeric_code' => 100,
                'svg_icon' => 'bg.svg',
                'created_at' => '2025-04-24 06:44:18',
                'updated_at' => '2025-04-24 06:44:18'
            ],
            [
                'name' => 'Burkina Faso',
                'alpha_2_code' => 'BF',
                'alpha_3_code' => 'BFA',
                'numeric_code' => 854,
                'svg_icon' => 'bf.svg',
                'created_at' => '2025-04-24 06:44:18',
                'updated_at' => '2025-04-24 06:44:18'
            ],
            [
                'name' => 'Burundi',
                'alpha_2_code' => 'BI',
                'alpha_3_code' => 'BDI',
                'numeric_code' => 108,
                'svg_icon' => 'bi.svg',
                'created_at' => '2025-04-24 06:44:18',
                'updated_at' => '2025-04-24 06:44:18'
            ],
            [
                'name' => 'Cabo Verde',
                'alpha_2_code' => 'CV',
                'alpha_3_code' => 'CPV',
                'numeric_code' => 132,
                'svg_icon' => 'cv.svg',
                'created_at' => '2025-04-24 06:44:18',
                'updated_at' => '2025-04-24 06:44:18'
            ],
            [
                'name' => 'Cambodia',
                'alpha_2_code' => 'KH',
                'alpha_3_code' => 'KHM',
                'numeric_code' => 116,
                'svg_icon' => 'kh.svg',
                'created_at' => '2025-04-24 06:44:18',
                'updated_at' => '2025-04-24 06:44:18'
            ],
            [
                'name' => 'Cameroon',
                'alpha_2_code' => 'CM',
                'alpha_3_code' => 'CMR',
                'numeric_code' => 120,
                'svg_icon' => 'cm.svg',
                'created_at' => '2025-04-24 06:44:18',
                'updated_at' => '2025-04-24 06:44:18'
            ],
            [
                'name' => 'Canada',
                'alpha_2_code' => 'CA',
                'alpha_3_code' => 'CAN',
                'numeric_code' => 124,
                'svg_icon' => 'ca.svg',
                'created_at' => '2025-04-24 06:44:18',
                'updated_at' => '2025-04-24 06:44:18'
            ],
            [
                'name' => 'Cayman Islands (the)',
                'alpha_2_code' => 'KY',
                'alpha_3_code' => 'CYM',
                'numeric_code' => 136,
                'svg_icon' => 'ky.svg',
                'created_at' => '2025-04-24 06:44:18',
                'updated_at' => '2025-04-24 06:44:18'
            ],
            [
                'name' => 'Central African Republic (the)',
                'alpha_2_code' => 'CF',
                'alpha_3_code' => 'CAF',
                'numeric_code' => 140,
                'svg_icon' => 'cf.svg',
                'created_at' => '2025-04-24 06:44:18',
                'updated_at' => '2025-04-24 06:44:18'
            ],
            [
                'name' => 'Chad',
                'alpha_2_code' => 'TD',
                'alpha_3_code' => 'TCD',
                'numeric_code' => 148,
                'svg_icon' => 'td.svg',
                'created_at' => '2025-04-24 06:44:18',
                'updated_at' => '2025-04-24 06:44:18'
            ],
            [
                'name' => 'Chile',
                'alpha_2_code' => 'CL',
                'alpha_3_code' => 'CHL',
                'numeric_code' => 152,
                'svg_icon' => 'cl.svg',
                'created_at' => '2025-04-24 06:44:18',
                'updated_at' => '2025-04-24 06:44:18'
            ],
            [
                'name' => 'China',
                'alpha_2_code' => 'CN',
                'alpha_3_code' => 'CHN',
                'numeric_code' => 156,
                'svg_icon' => 'cn.svg',
                'created_at' => '2025-04-24 06:44:18',
                'updated_at' => '2025-04-24 06:44:18'
            ],
            [
                'name' => 'Christmas Island',
                'alpha_2_code' => 'CX',
                'alpha_3_code' => 'CXR',
                'numeric_code' => 162,
                'svg_icon' => 'cx.svg',
                'created_at' => '2025-04-24 06:44:18',
                'updated_at' => '2025-04-24 06:44:18'
            ],
            [
                'name' => 'Cocos (Keeling) Islands (the)',
                'alpha_2_code' => 'CC',
                'alpha_3_code' => 'CCK',
                'numeric_code' => 166,
                'svg_icon' => 'cc.svg',
                'created_at' => '2025-04-24 06:44:18',
                'updated_at' => '2025-04-24 06:44:18'
            ],
            [
                'name' => 'Colombia',
                'alpha_2_code' => 'CO',
                'alpha_3_code' => 'COL',
                'numeric_code' => 170,
                'svg_icon' => 'co.svg',
                'created_at' => '2025-04-24 06:44:18',
                'updated_at' => '2025-04-24 06:44:18'
            ],
            [
                'name' => 'Comoros (the)',
                'alpha_2_code' => 'KM',
                'alpha_3_code' => 'COM',
                'numeric_code' => 174,
                'svg_icon' => 'km.svg',
                'created_at' => '2025-04-24 06:44:18',
                'updated_at' => '2025-04-24 06:44:18'
            ],
            [
                'name' => 'Congo (the)',
                'alpha_2_code' => 'CG',
                'alpha_3_code' => 'COG',
                'numeric_code' => 178,
                'svg_icon' => 'cg.svg',
                'created_at' => '2025-04-24 06:44:18',
                'updated_at' => '2025-04-24 06:44:18'
            ],
            [
                'name' => 'Congo (the Democratic Republic of the)',
                'alpha_2_code' => 'CD',
                'alpha_3_code' => 'COD',
                'numeric_code' => 180,
                'svg_icon' => 'cd.svg',
                'created_at' => '2025-04-24 06:44:18',
                'updated_at' => '2025-04-24 06:44:18'
            ],
            [
                'name' => 'Cook Islands (the)',
                'alpha_2_code' => 'CK',
                'alpha_3_code' => 'COK',
                'numeric_code' => 184,
                'svg_icon' => 'ck.svg',
                'created_at' => '2025-04-24 06:44:18',
                'updated_at' => '2025-04-24 06:44:18'
            ],
            [
                'name' => 'Costa Rica',
                'alpha_2_code' => 'CR',
                'alpha_3_code' => 'CRI',
                'numeric_code' => 188,
                'svg_icon' => 'cr.svg',
                'created_at' => '2025-04-24 06:44:18',
                'updated_at' => '2025-04-24 06:44:18'
            ],
            [
                'name' => 'Croatia',
                'alpha_2_code' => 'HR',
                'alpha_3_code' => 'HRV',
                'numeric_code' => 191,
                'svg_icon' => 'hr.svg',
                'created_at' => '2025-04-24 06:44:18',
                'updated_at' => '2025-04-24 06:44:18'
            ],
            [
                'name' => 'Cuba',
                'alpha_2_code' => 'CU',
                'alpha_3_code' => 'CUB',
                'numeric_code' => 192,
                'svg_icon' => 'cu.svg',
                'created_at' => '2025-04-24 06:44:18',
                'updated_at' => '2025-04-24 06:44:18'
            ],
            [
                'name' => 'Curaçao',
                'alpha_2_code' => 'CW',
                'alpha_3_code' => 'CUW',
                'numeric_code' => 531,
                'svg_icon' => 'cw.svg',
                'created_at' => '2025-04-24 06:44:18',
                'updated_at' => '2025-04-24 06:44:18'
            ],
            [
                'name' => 'Cyprus',
                'alpha_2_code' => 'CY',
                'alpha_3_code' => 'CYP',
                'numeric_code' => 196,
                'svg_icon' => 'cy.svg',
                'created_at' => '2025-04-24 06:44:18',
                'updated_at' => '2025-04-24 06:44:18'
            ],
            [
                'name' => 'Czechia',
                'alpha_2_code' => 'CZ',
                'alpha_3_code' => 'CZE',
                'numeric_code' => 203,
                'svg_icon' => 'cz.svg',
                'created_at' => '2025-04-24 06:44:18',
                'updated_at' => '2025-04-24 06:44:18'
            ],
            [
                'name' => 'Denmark',
                'alpha_2_code' => 'DK',
                'alpha_3_code' => 'DNK',
                'numeric_code' => 208,
                'svg_icon' => 'dk.svg',
                'created_at' => '2025-04-24 06:44:33',
                'updated_at' => '2025-04-24 06:44:33'
            ],
            [
                'name' => 'Djibouti',
                'alpha_2_code' => 'DJ',
                'alpha_3_code' => 'DJI',
                'numeric_code' => 262,
                'svg_icon' => 'dj.svg',
                'created_at' => '2025-04-24 06:44:33',
                'updated_at' => '2025-04-24 06:44:33'
            ],
            [
                'name' => 'Dominica',
                'alpha_2_code' => 'DM',
                'alpha_3_code' => 'DMA',
                'numeric_code' => 212,
                'svg_icon' => 'dm.svg',
                'created_at' => '2025-04-24 06:44:33',
                'updated_at' => '2025-04-24 06:44:33'
            ],
            [
                'name' => 'Dominican Republic (the)',
                'alpha_2_code' => 'DO',
                'alpha_3_code' => 'DOM',
                'numeric_code' => 214,
                'svg_icon' => 'do.svg',
                'created_at' => '2025-04-24 06:44:33',
                'updated_at' => '2025-04-24 06:44:33'
            ],
            [
                'name' => 'Ecuador',
                'alpha_2_code' => 'EC',
                'alpha_3_code' => 'ECU',
                'numeric_code' => 218,
                'svg_icon' => 'ec.svg',
                'created_at' => '2025-04-24 06:44:33',
                'updated_at' => '2025-04-24 06:44:33'
            ],
            [
                'name' => 'Egypt',
                'alpha_2_code' => 'EG',
                'alpha_3_code' => 'EGY',
                'numeric_code' => 818,
                'svg_icon' => 'eg.svg',
                'created_at' => '2025-04-24 06:44:33',
                'updated_at' => '2025-04-24 06:44:33'
            ],
            [
                'name' => 'El Salvador',
                'alpha_2_code' => 'SV',
                'alpha_3_code' => 'SLV',
                'numeric_code' => 222,
                'svg_icon' => 'sv.svg',
                'created_at' => '2025-04-24 06:44:33',
                'updated_at' => '2025-04-24 06:44:33'
            ],
            [
                'name' => 'Equatorial Guinea',
                'alpha_2_code' => 'GQ',
                'alpha_3_code' => 'GNQ',
                'numeric_code' => 226,
                'svg_icon' => 'gq.svg',
                'created_at' => '2025-04-24 06:44:33',
                'updated_at' => '2025-04-24 06:44:33'
            ],
            [
                'name' => 'Eritrea',
                'alpha_2_code' => 'ER',
                'alpha_3_code' => 'ERI',
                'numeric_code' => 232,
                'svg_icon' => 'er.svg',
                'created_at' => '2025-04-24 06:44:33',
                'updated_at' => '2025-04-24 06:44:33'
            ],
            [
                'name' => 'Estonia',
                'alpha_2_code' => 'EE',
                'alpha_3_code' => 'EST',
                'numeric_code' => 233,
                'svg_icon' => 'ee.svg',
                'created_at' => '2025-04-24 06:44:33',
                'updated_at' => '2025-04-24 06:44:33'
            ],
            [
                'name' => 'Eswatini',
                'alpha_2_code' => 'SZ',
                'alpha_3_code' => 'SWZ',
                'numeric_code' => 748,
                'svg_icon' => 'sz.svg',
                'created_at' => '2025-04-24 06:44:33',
                'updated_at' => '2025-04-24 06:44:33'
            ],
            [
                'name' => 'Ethiopia',
                'alpha_2_code' => 'ET',
                'alpha_3_code' => 'ETH',
                'numeric_code' => 231,
                'svg_icon' => 'et.svg',
                'created_at' => '2025-04-24 06:44:33',
                'updated_at' => '2025-04-24 06:44:33'
            ],
            [
                'name' => 'Falkland Islands (the) [Malvinas]',
                'alpha_2_code' => 'FK',
                'alpha_3_code' => 'FLK',
                'numeric_code' => 238,
                'svg_icon' => 'fk.svg',
                'created_at' => '2025-04-24 06:44:33',
                'updated_at' => '2025-04-24 06:44:33'
            ],
            [
                'name' => 'Faroe Islands (the)',
                'alpha_2_code' => 'FO',
                'alpha_3_code' => 'FRO',
                'numeric_code' => 234,
                'svg_icon' => 'fo.svg',
                'created_at' => '2025-04-24 06:44:33',
                'updated_at' => '2025-04-24 06:44:33'
            ],
            [
                'name' => 'Fiji',
                'alpha_2_code' => 'FJ',
                'alpha_3_code' => 'FJI',
                'numeric_code' => 242,
                'svg_icon' => 'fj.svg',
                'created_at' => '2025-04-24 06:44:33',
                'updated_at' => '2025-04-24 06:44:33'
            ],
            [
                'name' => 'Finland',
                'alpha_2_code' => 'FI',
                'alpha_3_code' => 'FIN',
                'numeric_code' => 246,
                'svg_icon' => 'fi.svg',
                'created_at' => '2025-04-24 06:44:33',
                'updated_at' => '2025-04-24 06:44:33'
            ],
            [
                'name' => 'France',
                'alpha_2_code' => 'FR',
                'alpha_3_code' => 'FRA',
                'numeric_code' => 250,
                'svg_icon' => 'fr.svg',
                'created_at' => '2025-04-24 06:44:33',
                'updated_at' => '2025-04-24 06:44:33'
            ],
            [
                'name' => 'French Guiana',
                'alpha_2_code' => 'GF',
                'alpha_3_code' => 'GUF',
                'numeric_code' => 254,
                'svg_icon' => 'gf.svg',
                'created_at' => '2025-04-24 06:44:33',
                'updated_at' => '2025-04-24 06:44:33'
            ],
            [
                'name' => 'French Polynesia',
                'alpha_2_code' => 'PF',
                'alpha_3_code' => 'PYF',
                'numeric_code' => 258,
                'svg_icon' => 'pf.svg',
                'created_at' => '2025-04-24 06:44:33',
                'updated_at' => '2025-04-24 06:44:33'
            ],
            [
                'name' => 'French Southern Territories (the)',
                'alpha_2_code' => 'TF',
                'alpha_3_code' => 'ATF',
                'numeric_code' => 260,
                'svg_icon' => 'tf.svg',
                'created_at' => '2025-04-24 06:44:33',
                'updated_at' => '2025-04-24 06:44:33'
            ],
            [
                'name' => 'Gabon',
                'alpha_2_code' => 'GA',
                'alpha_3_code' => 'GAB',
                'numeric_code' => 266,
                'svg_icon' => 'ga.svg',
                'created_at' => '2025-04-24 06:44:33',
                'updated_at' => '2025-04-24 06:44:33'
            ],
            [
                'name' => 'Gambia (the)',
                'alpha_2_code' => 'GM',
                'alpha_3_code' => 'GMB',
                'numeric_code' => 270,
                'svg_icon' => 'gm.svg',
                'created_at' => '2025-04-24 06:44:33',
                'updated_at' => '2025-04-24 06:44:33'
            ],
            [
                'name' => 'Georgia',
                'alpha_2_code' => 'GE',
                'alpha_3_code' => 'GEO',
                'numeric_code' => 268,
                'svg_icon' => 'ge.svg',
                'created_at' => '2025-04-24 06:44:33',
                'updated_at' => '2025-04-24 06:44:33'
            ],
            [
                'name' => 'Germany',
                'alpha_2_code' => 'DE',
                'alpha_3_code' => 'DEU',
                'numeric_code' => 276,
                'svg_icon' => 'de.svg',
                'created_at' => '2025-04-24 06:44:33',
                'updated_at' => '2025-04-24 06:44:33'
            ],
            [
                'name' => 'Ghana',
                'alpha_2_code' => 'GH',
                'alpha_3_code' => 'GHA',
                'numeric_code' => 288,
                'svg_icon' => 'gh.svg',
                'created_at' => '2025-04-24 06:44:33',
                'updated_at' => '2025-04-24 06:44:33'
            ],
            [
                'name' => 'Gibraltar',
                'alpha_2_code' => 'GI',
                'alpha_3_code' => 'GIB',
                'numeric_code' => 292,
                'svg_icon' => 'gi.svg',
                'created_at' => '2025-04-24 06:44:33',
                'updated_at' => '2025-04-24 06:44:33'
            ],
            [
                'name' => 'Greece',
                'alpha_2_code' => 'GR',
                'alpha_3_code' => 'GRC',
                'numeric_code' => 300,
                'svg_icon' => 'gr.svg',
                'created_at' => '2025-04-24 06:44:33',
                'updated_at' => '2025-04-24 06:44:33'
            ],
            [
                'name' => 'Greenland',
                'alpha_2_code' => 'GL',
                'alpha_3_code' => 'GRL',
                'numeric_code' => 304,
                'svg_icon' => 'gl.svg',
                'created_at' => '2025-04-24 06:44:33',
                'updated_at' => '2025-04-24 06:44:33'
            ],
            [
                'name' => 'Grenada',
                'alpha_2_code' => 'GD',
                'alpha_3_code' => 'GRD',
                'numeric_code' => 308,
                'svg_icon' => 'gd.svg',
                'created_at' => '2025-04-24 06:44:33',
                'updated_at' => '2025-04-24 06:44:33'
            ],
            [
                'name' => 'Guadeloupe',
                'alpha_2_code' => 'GP',
                'alpha_3_code' => 'GLP',
                'numeric_code' => 312,
                'svg_icon' => 'gp.svg',
                'created_at' => '2025-04-24 06:44:33',
                'updated_at' => '2025-04-24 06:44:33'
            ],
            [
                'name' => 'Guam',
                'alpha_2_code' => 'GU',
                'alpha_3_code' => 'GUM',
                'numeric_code' => 316,
                'svg_icon' => 'gu.svg',
                'created_at' => '2025-04-24 06:44:33',
                'updated_at' => '2025-04-24 06:44:33'
            ],
            [
                'name' => 'Guatemala',
                'alpha_2_code' => 'GT',
                'alpha_3_code' => 'GTM',
                'numeric_code' => 320,
                'svg_icon' => 'gt.svg',
                'created_at' => '2025-04-24 06:44:33',
                'updated_at' => '2025-04-24 06:44:33'
            ],
            [
                'name' => 'Guernsey',
                'alpha_2_code' => 'GG',
                'alpha_3_code' => 'GGY',
                'numeric_code' => 831,
                'svg_icon' => 'gg.svg',
                'created_at' => '2025-04-24 06:44:33',
                'updated_at' => '2025-04-24 06:44:33'
            ],
            [
                'name' => 'Guinea',
                'alpha_2_code' => 'GN',
                'alpha_3_code' => 'GIN',
                'numeric_code' => 324,
                'svg_icon' => 'gn.svg',
                'created_at' => '2025-04-24 06:44:33',
                'updated_at' => '2025-04-24 06:44:33'
            ],
            [
                'name' => 'Guinea-Bissau',
                'alpha_2_code' => 'GW',
                'alpha_3_code' => 'GNB',
                'numeric_code' => 624,
                'svg_icon' => 'gw.svg',
                'created_at' => '2025-04-24 06:44:33',
                'updated_at' => '2025-04-24 06:44:33'
            ],
            [
                'name' => 'Guyana',
                'alpha_2_code' => 'GY',
                'alpha_3_code' => 'GUY',
                'numeric_code' => 328,
                'svg_icon' => 'gy.svg',
                'created_at' => '2025-04-24 06:44:33',
                'updated_at' => '2025-04-24 06:44:33'
            ],
            [
                'name' => 'Haiti',
                'alpha_2_code' => 'HT',
                'alpha_3_code' => 'HTI',
                'numeric_code' => 332,
                'svg_icon' => 'ht.svg',
                'created_at' => '2025-04-24 06:44:33',
                'updated_at' => '2025-04-24 06:44:33'
            ],
            [
                'name' => 'Heard Island and McDonald Islands',
                'alpha_2_code' => 'HM',
                'alpha_3_code' => 'HMD',
                'numeric_code' => 334,
                'svg_icon' => 'hm.svg',
                'created_at' => '2025-04-24 06:44:33',
                'updated_at' => '2025-04-24 06:44:33'
            ],
            [
                'name' => 'Holy See (the)',
                'alpha_2_code' => 'VA',
                'alpha_3_code' => 'VAT',
                'numeric_code' => 336,
                'svg_icon' => 'va.svg',
                'created_at' => '2025-04-24 06:44:33',
                'updated_at' => '2025-04-24 06:44:33'
            ],
            [
                'name' => 'Honduras',
                'alpha_2_code' => 'HN',
                'alpha_3_code' => 'HND',
                'numeric_code' => 340,
                'svg_icon' => 'hn.svg',
                'created_at' => '2025-04-24 06:44:33',
                'updated_at' => '2025-04-24 06:44:33'
            ],
            [
                'name' => 'Hong Kong',
                'alpha_2_code' => 'HK',
                'alpha_3_code' => 'HKG',
                'numeric_code' => 344,
                'svg_icon' => 'hk.svg',
                'created_at' => '2025-04-24 06:44:33',
                'updated_at' => '2025-04-24 06:44:33'
            ],
            [
                'name' => 'Hungary',
                'alpha_2_code' => 'HU',
                'alpha_3_code' => 'HUN',
                'numeric_code' => 348,
                'svg_icon' => 'hu.svg',
                'created_at' => '2025-04-24 06:44:33',
                'updated_at' => '2025-04-24 06:44:33'
            ],
            [
                'name' => 'Iceland',
                'alpha_2_code' => 'IS',
                'alpha_3_code' => 'ISL',
                'numeric_code' => 352,
                'svg_icon' => 'is.svg',
                'created_at' => '2025-04-24 06:44:33',
                'updated_at' => '2025-04-24 06:44:33'
            ],
            [
                'name' => 'India',
                'alpha_2_code' => 'IN',
                'alpha_3_code' => 'IND',
                'numeric_code' => 356,
                'svg_icon' => 'in.svg',
                'created_at' => '2025-04-24 06:44:45',
                'updated_at' => '2025-04-24 06:44:45'
            ],
            [
                'name' => 'Indonesia',
                'alpha_2_code' => 'ID',
                'alpha_3_code' => 'IDN',
                'numeric_code' => 360,
                'svg_icon' => 'id.svg',
                'created_at' => '2025-04-24 06:44:45',
                'updated_at' => '2025-04-24 06:44:45'
            ],
            [
                'name' => 'Iran (Islamic Republic of)',
                'alpha_2_code' => 'IR',
                'alpha_3_code' => 'IRN',
                'numeric_code' => 364,
                'svg_icon' => 'ir.svg',
                'created_at' => '2025-04-24 06:44:45',
                'updated_at' => '2025-04-24 06:44:45'
            ],
            [
                'name' => 'Iraq',
                'alpha_2_code' => 'IQ',
                'alpha_3_code' => 'IRQ',
                'numeric_code' => 368,
                'svg_icon' => 'iq.svg',
                'created_at' => '2025-04-24 06:44:45',
                'updated_at' => '2025-04-24 06:44:45'
            ],
            [
                'name' => 'Ireland',
                'alpha_2_code' => 'IE',
                'alpha_3_code' => 'IRL',
                'numeric_code' => 372,
                'svg_icon' => 'ie.svg',
                'created_at' => '2025-04-24 06:44:45',
                'updated_at' => '2025-04-24 06:44:45'
            ],
            [
                'name' => 'Isle of Man',
                'alpha_2_code' => 'IM',
                'alpha_3_code' => 'IMN',
                'numeric_code' => 833,
                'svg_icon' => 'im.svg',
                'created_at' => '2025-04-24 06:44:45',
                'updated_at' => '2025-04-24 06:44:45'
            ],
            [
                'name' => 'Israel',
                'alpha_2_code' => 'IL',
                'alpha_3_code' => 'ISR',
                'numeric_code' => 376,
                'svg_icon' => 'il.svg',
                'created_at' => '2025-04-24 06:44:45',
                'updated_at' => '2025-04-24 06:44:45'
            ],
            [
                'name' => 'Italy',
                'alpha_2_code' => 'IT',
                'alpha_3_code' => 'ITA',
                'numeric_code' => 380,
                'svg_icon' => 'it.svg',
                'created_at' => '2025-04-24 06:44:45',
                'updated_at' => '2025-04-24 06:44:45'
            ],
            [
                'name' => 'Jamaica',
                'alpha_2_code' => 'JM',
                'alpha_3_code' => 'JAM',
                'numeric_code' => 388,
                'svg_icon' => 'jm.svg',
                'created_at' => '2025-04-24 06:44:45',
                'updated_at' => '2025-04-24 06:44:45'
            ],
            [
                'name' => 'Japan',
                'alpha_2_code' => 'JP',
                'alpha_3_code' => 'JPN',
                'numeric_code' => 392,
                'svg_icon' => 'jp.svg',
                'created_at' => '2025-04-24 06:44:45',
                'updated_at' => '2025-04-24 06:44:45'
            ],
            [
                'name' => 'Jersey',
                'alpha_2_code' => 'JE',
                'alpha_3_code' => 'JEY',
                'numeric_code' => 832,
                'svg_icon' => 'je.svg',
                'created_at' => '2025-04-24 06:44:45',
                'updated_at' => '2025-04-24 06:44:45'
            ],
            [
                'name' => 'Jordan',
                'alpha_2_code' => 'JO',
                'alpha_3_code' => 'JOR',
                'numeric_code' => 400,
                'svg_icon' => 'jo.svg',
                'created_at' => '2025-04-24 06:44:45',
                'updated_at' => '2025-04-24 06:44:45'
            ],
            [
                'name' => 'Kazakhstan',
                'alpha_2_code' => 'KZ',
                'alpha_3_code' => 'KAZ',
                'numeric_code' => 398,
                'svg_icon' => 'kz.svg',
                'created_at' => '2025-04-24 06:44:45',
                'updated_at' => '2025-04-24 06:44:45'
            ],
            [
                'name' => 'Kenya',
                'alpha_2_code' => 'KE',
                'alpha_3_code' => 'KEN',
                'numeric_code' => 404,
                'svg_icon' => 'ke.svg',
                'created_at' => '2025-04-24 06:44:45',
                'updated_at' => '2025-04-24 06:44:45'
            ],
            [
                'name' => 'Kiribati',
                'alpha_2_code' => 'KI',
                'alpha_3_code' => 'KIR',
                'numeric_code' => 296,
                'svg_icon' => 'ki.svg',
                'created_at' => '2025-04-24 06:44:45',
                'updated_at' => '2025-04-24 06:44:45'
            ],
            [
                'name' => "Korea (the Democratic People's Republic of)",
                'alpha_2_code' => 'KP',
                'alpha_3_code' => 'PRK',
                'numeric_code' => 408,
                'svg_icon' => 'kp.svg',
                'created_at' => '2025-04-24 06:44:45',
                'updated_at' => '2025-04-24 06:44:45'
            ],
            [
                'name' => 'Korea (the Republic of)',
                'alpha_2_code' => 'KR',
                'alpha_3_code' => 'KOR',
                'numeric_code' => 410,
                'svg_icon' => 'kr.svg',
                'created_at' => '2025-04-24 06:44:45',
                'updated_at' => '2025-04-24 06:44:45'
            ],
            [
                'name' => 'Kuwait',
                'alpha_2_code' => 'KW',
                'alpha_3_code' => 'KWT',
                'numeric_code' => 414,
                'svg_icon' => 'kw.svg',
                'created_at' => '2025-04-24 06:44:45',
                'updated_at' => '2025-04-24 06:44:45'
            ],
            [
                'name' => 'Kyrgyzstan',
                'alpha_2_code' => 'KG',
                'alpha_3_code' => 'KGZ',
                'numeric_code' => 417,
                'svg_icon' => 'kg.svg',
                'created_at' => '2025-04-24 06:44:45',
                'updated_at' => '2025-04-24 06:44:45'
            ],
            [
                'name' => "Lao People's Democratic Republic (the)",
                'alpha_2_code' => 'LA',
                'alpha_3_code' => 'LAO',
                'numeric_code' => 418,
                'svg_icon' => 'la.svg',
                'created_at' => '2025-04-24 06:44:45',
                'updated_at' => '2025-04-24 06:44:45'
            ],
            [
                'name' => 'Latvia',
                'alpha_2_code' => 'LV',
                'alpha_3_code' => 'LVA',
                'numeric_code' => 428,
                'svg_icon' => 'lv.svg',
                'created_at' => '2025-04-24 06:44:45',
                'updated_at' => '2025-04-24 06:44:45'
            ],
            [
                'name' => 'Lebanon',
                'alpha_2_code' => 'LB',
                'alpha_3_code' => 'LBN',
                'numeric_code' => 422,
                'svg_icon' => 'lb.svg',
                'created_at' => '2025-04-24 06:44:45',
                'updated_at' => '2025-04-24 06:44:45'
            ],
            [
                'name' => 'Lesotho',
                'alpha_2_code' => 'LS',
                'alpha_3_code' => 'LSO',
                'numeric_code' => 426,
                'svg_icon' => 'ls.svg',
                'created_at' => '2025-04-24 06:44:45',
                'updated_at' => '2025-04-24 06:44:45'
            ],
            [
                'name' => 'Liberia',
                'alpha_2_code' => 'LR',
                'alpha_3_code' => 'LBR',
                'numeric_code' => 430,
                'svg_icon' => 'lr.svg',
                'created_at' => '2025-04-24 06:44:45',
                'updated_at' => '2025-04-24 06:44:45'
            ],
            [
                'name' => 'Libya',
                'alpha_2_code' => 'LY',
                'alpha_3_code' => 'LBY',
                'numeric_code' => 434,
                'svg_icon' => 'ly.svg',
                'created_at' => '2025-04-24 06:44:45',
                'updated_at' => '2025-04-24 06:44:45'
            ],
            [
                'name' => 'Liechtenstein',
                'alpha_2_code' => 'LI',
                'alpha_3_code' => 'LIE',
                'numeric_code' => 438,
                'svg_icon' => 'li.svg',
                'created_at' => '2025-04-24 06:44:45',
                'updated_at' => '2025-04-24 06:44:45'
            ],
            [
                'name' => 'Lithuania',
                'alpha_2_code' => 'LT',
                'alpha_3_code' => 'LTU',
                'numeric_code' => 440,
                'svg_icon' => 'lt.svg',
                'created_at' => '2025-04-24 06:44:45',
                'updated_at' => '2025-04-24 06:44:45'
            ],
            [
                'name' => 'Luxembourg',
                'alpha_2_code' => 'LU',
                'alpha_3_code' => 'LUX',
                'numeric_code' => 442,
                'svg_icon' => 'lu.svg',
                'created_at' => '2025-04-24 06:44:45',
                'updated_at' => '2025-04-24 06:44:45'
            ],
            [
                'name' => 'Macao',
                'alpha_2_code' => 'MO',
                'alpha_3_code' => 'MAC',
                'numeric_code' => 446,
                'svg_icon' => 'mo.svg',
                'created_at' => '2025-04-24 06:44:45',
                'updated_at' => '2025-04-24 06:44:45'
            ],
            [
                'name' => 'Madagascar',
                'alpha_2_code' => 'MG',
                'alpha_3_code' => 'MDG',
                'numeric_code' => 450,
                'svg_icon' => 'mg.svg',
                'created_at' => '2025-04-24 06:44:45',
                'updated_at' => '2025-04-24 06:44:45'
            ],
            [
                'name' => 'Malawi',
                'alpha_2_code' => 'MW',
                'alpha_3_code' => 'MWI',
                'numeric_code' => 454,
                'svg_icon' => 'mw.svg',
                'created_at' => '2025-04-24 06:44:45',
                'updated_at' => '2025-04-24 06:44:45'
            ],
            [
                'name' => 'Malaysia',
                'alpha_2_code' => 'MY',
                'alpha_3_code' => 'MYS',
                'numeric_code' => 458,
                'svg_icon' => 'my.svg',
                'created_at' => '2025-04-24 06:44:45',
                'updated_at' => '2025-04-24 06:44:45'
            ],
            [
                'name' => 'Maldives',
                'alpha_2_code' => 'MV',
                'alpha_3_code' => 'MDV',
                'numeric_code' => 462,
                'svg_icon' => 'mv.svg',
                'created_at' => '2025-04-24 06:44:45',
                'updated_at' => '2025-04-24 06:44:45'
            ],
            [
                'name' => 'Mali',
                'alpha_2_code' => 'ML',
                'alpha_3_code' => 'MLI',
                'numeric_code' => 466,
                'svg_icon' => 'ml.svg',
                'created_at' => '2025-04-24 06:44:45',
                'updated_at' => '2025-04-24 06:44:45'
            ],
            [
                'name' => 'Malta',
                'alpha_2_code' => 'MT',
                'alpha_3_code' => 'MLT',
                'numeric_code' => 470,
                'svg_icon' => 'mt.svg',
                'created_at' => '2025-04-24 06:44:45',
                'updated_at' => '2025-04-24 06:44:45'
            ],
            [
                'name' => 'Marshall Islands (the)',
                'alpha_2_code' => 'MH',
                'alpha_3_code' => 'MHL',
                'numeric_code' => 584,
                'svg_icon' => 'mh.svg',
                'created_at' => '2025-04-24 06:44:45',
                'updated_at' => '2025-04-24 06:44:45'
            ],
            [
                'name' => 'Martinique',
                'alpha_2_code' => 'MQ',
                'alpha_3_code' => 'MTQ',
                'numeric_code' => 474,
                'svg_icon' => 'mq.svg',
                'created_at' => '2025-04-24 06:44:45',
                'updated_at' => '2025-04-24 06:44:45'
            ],
            [
                'name' => 'Mauritania',
                'alpha_2_code' => 'MR',
                'alpha_3_code' => 'MRT',
                'numeric_code' => 478,
                'svg_icon' => 'mr.svg',
                'created_at' => '2025-04-24 06:44:45',
                'updated_at' => '2025-04-24 06:44:45'
            ],
            [
                'name' => 'Mauritius',
                'alpha_2_code' => 'MU',
                'alpha_3_code' => 'MUS',
                'numeric_code' => 480,
                'svg_icon' => 'mu.svg',
                'created_at' => '2025-04-24 06:44:45',
                'updated_at' => '2025-04-24 06:44:45'
            ],
            [
                'name' => 'Mayotte',
                'alpha_2_code' => 'YT',
                'alpha_3_code' => 'MYT',
                'numeric_code' => 175,
                'svg_icon' => 'yt.svg',
                'created_at' => '2025-04-24 06:44:45',
                'updated_at' => '2025-04-24 06:44:45'
            ],
            [
                'name' => 'Mexico',
                'alpha_2_code' => 'MX',
                'alpha_3_code' => 'MEX',
                'numeric_code' => 484,
                'svg_icon' => 'mx.svg',
                'created_at' => '2025-04-24 06:44:45',
                'updated_at' => '2025-04-24 06:44:45'
            ],
            [
                'name' => 'Micronesia (Federated States of)',
                'alpha_2_code' => 'FM',
                'alpha_3_code' => 'FSM',
                'numeric_code' => 583,
                'svg_icon' => 'fm.svg',
                'created_at' => '2025-04-24 06:44:45',
                'updated_at' => '2025-04-24 06:44:45'
            ],
            [
                'name' => 'Moldova (Republic of)',
                'alpha_2_code' => 'MD',
                'alpha_3_code' => 'MDA',
                'numeric_code' => 498,
                'svg_icon' => 'md.svg',
                'created_at' => '2025-04-24 06:44:45',
                'updated_at' => '2025-04-24 06:44:45'
            ],
            [
                'name' => 'Monaco',
                'alpha_2_code' => 'MC',
                'alpha_3_code' => 'MCO',
                'numeric_code' => 492,
                'svg_icon' => 'mc.svg',
                'created_at' => '2025-04-24 06:44:45',
                'updated_at' => '2025-04-24 06:44:45'
            ],
            [
                'name' => 'Mongolia',
                'alpha_2_code' => 'MN',
                'alpha_3_code' => 'MNG',
                'numeric_code' => 496,
                'svg_icon' => 'mn.svg',
                'created_at' => '2025-04-24 06:44:45',
                'updated_at' => '2025-04-24 06:44:45'
            ],
            [
                'name' => 'Montenegro',
                'alpha_2_code' => 'ME',
                'alpha_3_code' => 'MNE',
                'numeric_code' => 499,
                'svg_icon' => 'me.svg',
                'created_at' => '2025-04-24 06:44:45',
                'updated_at' => '2025-04-24 06:44:45'
            ],
            [
                'name' => 'Montserrat',
                'alpha_2_code' => 'MS',
                'alpha_3_code' => 'MSR',
                'numeric_code' => 500,
                'svg_icon' => 'ms.svg',
                'created_at' => '2025-04-24 06:44:45',
                'updated_at' => '2025-04-24 06:44:45'
            ],
            [
                'name' => 'Morocco',
                'alpha_2_code' => 'MA',
                'alpha_3_code' => 'MAR',
                'numeric_code' => 504,
                'svg_icon' => 'ma.svg',
                'created_at' => '2025-04-24 06:44:45',
                'updated_at' => '2025-04-24 06:44:45'
            ],
            [
                'name' => 'Mozambique',
                'alpha_2_code' => 'MZ',
                'alpha_3_code' => 'MOZ',
                'numeric_code' => 508,
                'svg_icon' => 'mz.svg',
                'created_at' => '2025-04-24 06:44:57',
                'updated_at' => '2025-04-24 06:44:57'
            ],
            [
                'name' => 'Myanmar',
                'alpha_2_code' => 'MM',
                'alpha_3_code' => 'MMR',
                'numeric_code' => 104,
                'svg_icon' => 'mm.svg',
                'created_at' => '2025-04-24 06:44:57',
                'updated_at' => '2025-04-24 06:44:57'
            ],
            [
                'name' => 'Namibia',
                'alpha_2_code' => 'NA', // Corrected from nan to 'NA'
                'alpha_3_code' => 'NAM',
                'numeric_code' => 516,
                'svg_icon' => 'na.svg',
                'created_at' => '2025-04-24 06:44:57',
                'updated_at' => '2025-04-24 06:44:57'
            ],
            [
                'name' => 'Nauru',
                'alpha_2_code' => 'NR',
                'alpha_3_code' => 'NRU',
                'numeric_code' => 520,
                'svg_icon' => 'nr.svg',
                'created_at' => '2025-04-24 06:44:57',
                'updated_at' => '2025-04-24 06:44:57'
            ],
            [
                'name' => 'Nepal',
                'alpha_2_code' => 'NP',
                'alpha_3_code' => 'NPL',
                'numeric_code' => 524,
                'svg_icon' => 'np.svg',
                'created_at' => '2025-04-24 06:44:57',
                'updated_at' => '2025-04-24 06:44:57'
            ],
            [
                'name' => 'Netherlands (the)',
                'alpha_2_code' => 'NL',
                'alpha_3_code' => 'NLD',
                'numeric_code' => 528,
                'svg_icon' => 'nl.svg',
                'created_at' => '2025-04-24 06:44:57',
                'updated_at' => '2025-04-24 06:44:57'
            ],
            [
                'name' => 'New Caledonia',
                'alpha_2_code' => 'NC',
                'alpha_3_code' => 'NCL',
                'numeric_code' => 540,
                'svg_icon' => 'nc.svg',
                'created_at' => '2025-04-24 06:44:57',
                'updated_at' => '2025-04-24 06:44:57'
            ],
            [
                'name' => 'New Zealand',
                'alpha_2_code' => 'NZ',
                'alpha_3_code' => 'NZL',
                'numeric_code' => 554,
                'svg_icon' => 'nz.svg',
                'created_at' => '2025-04-24 06:44:57',
                'updated_at' => '2025-04-24 06:44:57'
            ],
            [
                'name' => 'Nicaragua',
                'alpha_2_code' => 'NI',
                'alpha_3_code' => 'NIC',
                'numeric_code' => 558,
                'svg_icon' => 'ni.svg',
                'created_at' => '2025-04-24 06:44:57',
                'updated_at' => '2025-04-24 06:44:57'
            ],
            [
                'name' => 'Niger (the)',
                'alpha_2_code' => 'NE',
                'alpha_3_code' => 'NER',
                'numeric_code' => 562,
                'svg_icon' => 'ne.svg',
                'created_at' => '2025-04-24 06:44:57',
                'updated_at' => '2025-04-24 06:44:57'
            ],
            [
                'name' => 'Nigeria',
                'alpha_2_code' => 'NG',
                'alpha_3_code' => 'NGA',
                'numeric_code' => 566,
                'svg_icon' => 'ng.svg',
                'created_at' => '2025-04-24 06:44:57',
                'updated_at' => '2025-04-24 06:44:57'
            ],
            [
                'name' => 'Niue',
                'alpha_2_code' => 'NU',
                'alpha_3_code' => 'NIU',
                'numeric_code' => 570,
                'svg_icon' => 'nu.svg',
                'created_at' => '2025-04-24 06:44:57',
                'updated_at' => '2025-04-24 06:44:57'
            ],
            [
                'name' => 'Norfolk Island',
                'alpha_2_code' => 'NF',
                'alpha_3_code' => 'NFK',
                'numeric_code' => 574,
                'svg_icon' => 'nf.svg',
                'created_at' => '2025-04-24 06:44:57',
                'updated_at' => '2025-04-24 06:44:57'
            ],
            [
                'name' => 'North Macedonia',
                'alpha_2_code' => 'MK',
                'alpha_3_code' => 'MKD',
                'numeric_code' => 807,
                'svg_icon' => 'mk.svg',
                'created_at' => '2025-04-24 06:44:57',
                'updated_at' => '2025-04-24 06:44:57'
            ],
            [
                'name' => 'Northern Mariana Islands (the)',
                'alpha_2_code' => 'MP',
                'alpha_3_code' => 'MNP',
                'numeric_code' => 580,
                'svg_icon' => 'mp.svg',
                'created_at' => '2025-04-24 06:44:57',
                'updated_at' => '2025-04-24 06:44:57'
            ],
            [
                'name' => 'Norway',
                'alpha_2_code' => 'NO',
                'alpha_3_code' => 'NOR',
                'numeric_code' => 578,
                'svg_icon' => 'no.svg',
                'created_at' => '2025-04-24 06:44:57',
                'updated_at' => '2025-04-24 06:44:57'
            ],
            [
                'name' => 'Oman',
                'alpha_2_code' => 'OM',
                'alpha_3_code' => 'OMN',
                'numeric_code' => 512,
                'svg_icon' => 'om.svg',
                'created_at' => '2025-04-24 06:44:57',
                'updated_at' => '2025-04-24 06:44:57'
            ],
            [
                'name' => 'Pakistan',
                'alpha_2_code' => 'PK',
                'alpha_3_code' => 'PAK',
                'numeric_code' => 586,
                'svg_icon' => 'pk.svg',
                'created_at' => '2025-04-24 06:44:57',
                'updated_at' => '2025-04-24 06:44:57'
            ],
            [
                'name' => 'Palau',
                'alpha_2_code' => 'PW',
                'alpha_3_code' => 'PLW',
                'numeric_code' => 585,
                'svg_icon' => 'pw.svg',
                'created_at' => '2025-04-24 06:44:57',
                'updated_at' => '2025-04-24 06:44:57'
            ],
            [
                'name' => 'Panama',
                'alpha_2_code' => 'PA',
                'alpha_3_code' => 'PAN',
                'numeric_code' => 591,
                'svg_icon' => 'pa.svg',
                'created_at' => '2025-04-24 06:44:57',
                'updated_at' => '2025-04-24 06:44:57'
            ],
            [
                'name' => 'Papua New Guinea',
                'alpha_2_code' => 'PG',
                'alpha_3_code' => 'PNG',
                'numeric_code' => 598,
                'svg_icon' => 'pg.svg',
                'created_at' => '2025-04-24 06:44:57',
                'updated_at' => '2025-04-24 06:44:57'
            ],
            [
                'name' => 'Paraguay',
                'alpha_2_code' => 'PY',
                'alpha_3_code' => 'PRY',
                'numeric_code' => 600,
                'svg_icon' => 'py.svg',
                'created_at' => '2025-04-24 06:44:57',
                'updated_at' => '2025-04-24 06:44:57'
            ],
            [
                'name' => 'Peru',
                'alpha_2_code' => 'PE',
                'alpha_3_code' => 'PER',
                'numeric_code' => 604,
                'svg_icon' => 'pe.svg',
                'created_at' => '2025-04-24 06:44:57',
                'updated_at' => '2025-04-24 06:44:57'
            ],
            [
                'name' => 'Philippines',
                'alpha_2_code' => 'PH',
                'alpha_3_code' => 'PHL',
                'numeric_code' => 608,
                'svg_icon' => 'ph.svg',
                'created_at' => '2025-04-24 06:44:57',
                'updated_at' => '2025-04-24 06:44:57'
            ],
            [
                'name' => 'Pitcairn',
                'alpha_2_code' => 'PN',
                'alpha_3_code' => 'PCN',
                'numeric_code' => 612,
                'svg_icon' => 'pn.svg',
                'created_at' => '2025-04-24 06:44:57',
                'updated_at' => '2025-04-24 06:44:57'
            ],
            [
                'name' => 'Poland',
                'alpha_2_code' => 'PL',
                'alpha_3_code' => 'POL',
                'numeric_code' => 616,
                'svg_icon' => 'pl.svg',
                'created_at' => '2025-04-24 06:44:57',
                'updated_at' => '2025-04-24 06:44:57'
            ],
            [
                'name' => 'Portugal',
                'alpha_2_code' => 'PT',
                'alpha_3_code' => 'PRT',
                'numeric_code' => 620,
                'svg_icon' => 'pt.svg',
                'created_at' => '2025-04-24 06:44:57',
                'updated_at' => '2025-04-24 06:44:57'
            ],
            [
                'name' => 'Puerto Rico',
                'alpha_2_code' => 'PR',
                'alpha_3_code' => 'PRI',
                'numeric_code' => 630,
                'svg_icon' => 'pr.svg',
                'created_at' => '2025-04-24 06:44:57',
                'updated_at' => '2025-04-24 06:44:57'
            ],
            [
                'name' => 'Qatar',
                'alpha_2_code' => 'QA',
                'alpha_3_code' => 'QAT',
                'numeric_code' => 634,
                'svg_icon' => 'qa.svg',
                'created_at' => '2025-04-24 06:44:57',
                'updated_at' => '2025-04-24 06:44:57'
            ],
            [
                'name' => 'Romania',
                'alpha_2_code' => 'RO',
                'alpha_3_code' => 'ROU',
                'numeric_code' => 642,
                'svg_icon' => 'ro.svg',
                'created_at' => '2025-04-24 06:44:57',
                'updated_at' => '2025-04-24 06:44:57'
            ],
            [
                'name' => 'Russian Federation (the)',
                'alpha_2_code' => 'RU',
                'alpha_3_code' => 'RUS',
                'numeric_code' => 643,
                'svg_icon' => 'ru.svg',
                'created_at' => '2025-04-24 06:44:57',
                'updated_at' => '2025-04-24 06:44:57'
            ],
            [
                'name' => 'Rwanda',
                'alpha_2_code' => 'RW',
                'alpha_3_code' => 'RWA',
                'numeric_code' => 646,
                'svg_icon' => 'rw.svg',
                'created_at' => '2025-04-24 06:44:57',
                'updated_at' => '2025-04-24 06:44:57'
            ],
            [
                'name' => 'Réunion',
                'alpha_2_code' => 'RE',
                'alpha_3_code' => 'REU',
                'numeric_code' => 638,
                'svg_icon' => 're.svg',
                'created_at' => '2025-04-24 06:44:57',
                'updated_at' => '2025-04-24 06:44:57'
            ],
            [
                'name' => 'Saint Barthélemy',
                'alpha_2_code' => 'BL',
                'alpha_3_code' => 'BLM',
                'numeric_code' => 652,
                'svg_icon' => 'bl.svg',
                'created_at' => '2025-04-24 06:44:57',
                'updated_at' => '2025-04-24 06:44:57'
            ],
            [
                'name' => 'Saint Helena, Ascension and Tristan da Cunha',
                'alpha_2_code' => 'SH',
                'alpha_3_code' => 'SHN',
                'numeric_code' => 654,
                'svg_icon' => 'sh.svg',
                'created_at' => '2025-04-24 06:44:57',
                'updated_at' => '2025-04-24 06:44:57'
            ],
            [
                'name' => 'Saint Kitts and Nevis',
                'alpha_2_code' => 'KN',
                'alpha_3_code' => 'KNA',
                'numeric_code' => 659,
                'svg_icon' => 'kn.svg',
                'created_at' => '2025-04-24 06:44:57',
                'updated_at' => '2025-04-24 06:44:57'
            ],
            [
                'name' => 'Saint Lucia',
                'alpha_2_code' => 'LC',
                'alpha_3_code' => 'LCA',
                'numeric_code' => 662,
                'svg_icon' => 'lc.svg',
                'created_at' => '2025-04-24 06:44:57',
                'updated_at' => '2025-04-24 06:44:57'
            ],
            [
                'name' => 'Saint Martin (French part)',
                'alpha_2_code' => 'MF',
                'alpha_3_code' => 'MAF',
                'numeric_code' => 663,
                'svg_icon' => 'mf.svg',
                'created_at' => '2025-04-24 06:44:57',
                'updated_at' => '2025-04-24 06:44:57'
            ],
            [
                'name' => 'Saint Pierre and Miquelon',
                'alpha_2_code' => 'PM',
                'alpha_3_code' => 'SPM',
                'numeric_code' => 666,
                'svg_icon' => 'pm.svg',
                'created_at' => '2025-04-24 06:44:57',
                'updated_at' => '2025-04-24 06:44:57'
            ],
            [
                'name' => 'Saint Vincent and the Grenadines',
                'alpha_2_code' => 'VC',
                'alpha_3_code' => 'VCT',
                'numeric_code' => 670,
                'svg_icon' => 'vc.svg',
                'created_at' => '2025-04-24 06:44:57',
                'updated_at' => '2025-04-24 06:44:57'
            ],
            [
                'name' => 'Samoa',
                'alpha_2_code' => 'WS',
                'alpha_3_code' => 'WSM',
                'numeric_code' => 882,
                'svg_icon' => 'ws.svg',
                'created_at' => '2025-04-24 06:44:57',
                'updated_at' => '2025-04-24 06:44:57'
            ],
            [
                'name' => 'San Marino',
                'alpha_2_code' => 'SM',
                'alpha_3_code' => 'SMR',
                'numeric_code' => 674,
                'svg_icon' => 'sm.svg',
                'created_at' => '2025-04-24 06:44:57',
                'updated_at' => '2025-04-24 06:44:57'
            ],
            [
                'name' => 'Sao Tome and Principe',
                'alpha_2_code' => 'ST',
                'alpha_3_code' => 'STP',
                'numeric_code' => 678,
                'svg_icon' => 'st.svg',
                'created_at' => '2025-04-24 06:44:57',
                'updated_at' => '2025-04-24 06:44:57'
            ],
            [
                'name' => 'Saudi Arabia',
                'alpha_2_code' => 'SA',
                'alpha_3_code' => 'SAU',
                'numeric_code' => 682,
                'svg_icon' => 'sa.svg',
                'created_at' => '2025-04-24 06:44:57',
                'updated_at' => '2025-04-24 06:44:57'
            ],
            [
                'name' => 'Senegal',
                'alpha_2_code' => 'SN',
                'alpha_3_code' => 'SEN',
                'numeric_code' => 686,
                'svg_icon' => 'sn.svg',
                'created_at' => '2025-04-24 06:44:57',
                'updated_at' => '2025-04-24 06:44:57'
            ],
            [
                'name' => 'Serbia',
                'alpha_2_code' => 'RS',
                'alpha_3_code' => 'SRB',
                'numeric_code' => 688,
                'svg_icon' => 'rs.svg',
                'created_at' => '2025-04-24 06:44:57',
                'updated_at' => '2025-04-24 06:44:57'
            ],
            [
                'name' => 'Seychelles',
                'alpha_2_code' => 'SC',
                'alpha_3_code' => 'SYC',
                'numeric_code' => 690,
                'svg_icon' => 'sc.svg',
                'created_at' => '2025-04-24 06:44:57',
                'updated_at' => '2025-04-24 06:44:57'
            ],
            [
                'name' => 'Sierra Leone',
                'alpha_2_code' => 'SL',
                'alpha_3_code' => 'SLE',
                'numeric_code' => 694,
                'svg_icon' => 'sl.svg',
                'created_at' => '2025-04-24 06:44:57',
                'updated_at' => '2025-04-24 06:44:57'
            ],
            [
                'name' => 'Singapore',
                'alpha_2_code' => 'SG',
                'alpha_3_code' => 'SGP',
                'numeric_code' => 702,
                'svg_icon' => 'sg.svg',
                'created_at' => '2025-04-24 06:44:57',
                'updated_at' => '2025-04-24 06:44:57'
            ],
            [
                'name' => 'Sint Maarten (Dutch part)',
                'alpha_2_code' => 'SX',
                'alpha_3_code' => 'SXM',
                'numeric_code' => 534,
                'svg_icon' => 'sx.svg',
                'created_at' => '2025-04-24 06:45:06',
                'updated_at' => '2025-04-24 06:45:06'
            ],
            [
                'name' => 'Slovakia',
                'alpha_2_code' => 'SK',
                'alpha_3_code' => 'SVK',
                'numeric_code' => 703,
                'svg_icon' => 'sk.svg',
                'created_at' => '2025-04-24 06:45:06',
                'updated_at' => '2025-04-24 06:45:06'
            ],
            [
                'name' => 'Slovenia',
                'alpha_2_code' => 'SI',
                'alpha_3_code' => 'SVN',
                'numeric_code' => 705,
                'svg_icon' => 'si.svg',
                'created_at' => '2025-04-24 06:45:06',
                'updated_at' => '2025-04-24 06:45:06'
            ],
            [
                'name' => 'Solomon Islands',
                'alpha_2_code' => 'SB',
                'alpha_3_code' => 'SLB',
                'numeric_code' => 90,
                'svg_icon' => 'sb.svg',
                'created_at' => '2025-04-24 06:45:06',
                'updated_at' => '2025-04-24 06:45:06'
            ],
            [
                'name' => 'Somalia',
                'alpha_2_code' => 'SO',
                'alpha_3_code' => 'SOM',
                'numeric_code' => 706,
                'svg_icon' => 'so.svg',
                'created_at' => '2025-04-24 06:45:06',
                'updated_at' => '2025-04-24 06:45:06'
            ],
            [
                'name' => 'South Africa',
                'alpha_2_code' => 'ZA',
                'alpha_3_code' => 'ZAF',
                'numeric_code' => 710,
                'svg_icon' => 'za.svg',
                'created_at' => '2025-04-24 06:45:06',
                'updated_at' => '2025-04-24 06:45:06'
            ],
            [
                'name' => 'South Georgia and the South Sandwich Islands',
                'alpha_2_code' => 'GS',
                'alpha_3_code' => 'SGS',
                'numeric_code' => 239,
                'svg_icon' => 'gs.svg',
                'created_at' => '2025-04-24 06:45:06',
                'updated_at' => '2025-04-24 06:45:06'
            ],
            [
                'name' => 'South Sudan',
                'alpha_2_code' => 'SS',
                'alpha_3_code' => 'SSD',
                'numeric_code' => 728,
                'svg_icon' => 'ss.svg',
                'created_at' => '2025-04-24 06:45:06',
                'updated_at' => '2025-04-24 06:45:06'
            ],
            [
                'name' => 'Spain',
                'alpha_2_code' => 'ES',
                'alpha_3_code' => 'ESP',
                'numeric_code' => 724,
                'svg_icon' => 'es.svg',
                'created_at' => '2025-04-24 06:45:06',
                'updated_at' => '2025-04-24 06:45:06'
            ],
            [
                'name' => 'Sri Lanka',
                'alpha_2_code' => 'LK',
                'alpha_3_code' => 'LKA',
                'numeric_code' => 144,
                'svg_icon' => 'lk.svg',
                'created_at' => '2025-04-24 06:45:06',
                'updated_at' => '2025-04-24 06:45:06'
            ],
            [
                'name' => 'Sudan (the)',
                'alpha_2_code' => 'SD',
                'alpha_3_code' => 'SDN',
                'numeric_code' => 736, // Original file had 736, common ISO 3166-1 is 729. Keeping 736 as per original data intent unless specified.
                'svg_icon' => 'sd.svg',
                'created_at' => '2025-04-24 06:45:06',
                'updated_at' => '2025-04-24 06:45:06'
            ],
            [
                'name' => 'Suriname',
                'alpha_2_code' => 'SR',
                'alpha_3_code' => 'SUR',
                'numeric_code' => 740,
                'svg_icon' => 'sr.svg',
                'created_at' => '2025-04-24 06:45:06',
                'updated_at' => '2025-04-24 06:45:06'
            ],
            [
                'name' => 'Svalbard and Jan Mayen',
                'alpha_2_code' => 'SJ',
                'alpha_3_code' => 'SJM',
                'numeric_code' => 744,
                'svg_icon' => 'sj.svg',
                'created_at' => '2025-04-24 06:45:06',
                'updated_at' => '2025-04-24 06:45:06'
            ],
            [
                'name' => 'Sweden',
                'alpha_2_code' => 'SE',
                'alpha_3_code' => 'SWE',
                'numeric_code' => 752,
                'svg_icon' => 'se.svg',
                'created_at' => '2025-04-24 06:45:06',
                'updated_at' => '2025-04-24 06:45:06'
            ],
            [
                'name' => 'Switzerland',
                'alpha_2_code' => 'CH',
                'alpha_3_code' => 'CHE',
                'numeric_code' => 756,
                'svg_icon' => 'ch.svg',
                'created_at' => '2025-04-24 06:45:06',
                'updated_at' => '2025-04-24 06:45:06'
            ],
            [
                'name' => 'Syrian Arab Republic (the)',
                'alpha_2_code' => 'SY',
                'alpha_3_code' => 'SYR',
                'numeric_code' => 760,
                'svg_icon' => 'sy.svg',
                'created_at' => '2025-04-24 06:45:06',
                'updated_at' => '2025-04-24 06:45:06'
            ],
            [
                'name' => 'Taiwan',
                'alpha_2_code' => 'TW',
                'alpha_3_code' => 'TWN',
                'numeric_code' => 158,
                'svg_icon' => 'tw.svg',
                'created_at' => '2025-04-24 06:45:06',
                'updated_at' => '2025-04-24 06:45:06'
            ],
            [
                'name' => 'Tajikistan',
                'alpha_2_code' => 'TJ',
                'alpha_3_code' => 'TJK',
                'numeric_code' => 762,
                'svg_icon' => 'tj.svg',
                'created_at' => '2025-04-24 06:45:06',
                'updated_at' => '2025-04-24 06:45:06'
            ],
            [
                'name' => 'Tanzania (United Republic of)',
                'alpha_2_code' => 'TZ',
                'alpha_3_code' => 'TZA',
                'numeric_code' => 834,
                'svg_icon' => 'tz.svg',
                'created_at' => '2025-04-24 06:45:06',
                'updated_at' => '2025-04-24 06:45:06'
            ],
            [
                'name' => 'Thailand',
                'alpha_2_code' => 'TH',
                'alpha_3_code' => 'THA',
                'numeric_code' => 764,
                'svg_icon' => 'th.svg',
                'created_at' => '2025-04-24 06:45:06',
                'updated_at' => '2025-04-24 06:45:06'
            ],
            [
                'name' => 'Timor-Leste',
                'alpha_2_code' => 'TL',
                'alpha_3_code' => 'TLS',
                'numeric_code' => 626,
                'svg_icon' => 'tl.svg',
                'created_at' => '2025-04-24 06:45:06',
                'updated_at' => '2025-04-24 06:45:06'
            ],
            [
                'name' => 'Togo',
                'alpha_2_code' => 'TG',
                'alpha_3_code' => 'TGO',
                'numeric_code' => 768,
                'svg_icon' => 'tg.svg',
                'created_at' => '2025-04-24 06:45:06',
                'updated_at' => '2025-04-24 06:45:06'
            ],
            [
                'name' => 'Tokelau',
                'alpha_2_code' => 'TK',
                'alpha_3_code' => 'TKL',
                'numeric_code' => 772,
                'svg_icon' => 'tk.svg',
                'created_at' => '2025-04-24 06:45:06',
                'updated_at' => '2025-04-24 06:45:06'
            ],
            [
                'name' => 'Tonga',
                'alpha_2_code' => 'TO',
                'alpha_3_code' => 'TON',
                'numeric_code' => 776,
                'svg_icon' => 'to.svg',
                'created_at' => '2025-04-24 06:45:06',
                'updated_at' => '2025-04-24 06:45:06'
            ],
            [
                'name' => 'Trinidad and Tobago',
                'alpha_2_code' => 'TT',
                'alpha_3_code' => 'TTO',
                'numeric_code' => 780,
                'svg_icon' => 'tt.svg',
                'created_at' => '2025-04-24 06:45:06',
                'updated_at' => '2025-04-24 06:45:06'
            ],
            [
                'name' => 'Tunisia',
                'alpha_2_code' => 'TN',
                'alpha_3_code' => 'TUN',
                'numeric_code' => 788,
                'svg_icon' => 'tn.svg',
                'created_at' => '2025-04-24 06:45:06',
                'updated_at' => '2025-04-24 06:45:06'
            ],
            [
                'name' => 'Turkey',
                'alpha_2_code' => 'TR',
                'alpha_3_code' => 'TUR',
                'numeric_code' => 792,
                'svg_icon' => 'tr.svg',
                'created_at' => '2025-04-24 06:45:06',
                'updated_at' => '2025-04-24 06:45:06'
            ],
            [
                'name' => 'Turkmenistan',
                'alpha_2_code' => 'TM',
                'alpha_3_code' => 'TKM',
                'numeric_code' => 795,
                'svg_icon' => 'tm.svg',
                'created_at' => '2025-04-24 06:45:06',
                'updated_at' => '2025-04-24 06:45:06'
            ],
            [
                'name' => 'Tuvalu',
                'alpha_2_code' => 'TV',
                'alpha_3_code' => 'TUV',
                'numeric_code' => 798,
                'svg_icon' => 'tv.svg',
                'created_at' => '2025-04-24 06:45:06',
                'updated_at' => '2025-04-24 06:45:06'
            ],
            [
                'name' => 'Uganda',
                'alpha_2_code' => 'UG',
                'alpha_3_code' => 'UGA',
                'numeric_code' => 800,
                'svg_icon' => 'ug.svg',
                'created_at' => '2025-04-24 06:45:06',
                'updated_at' => '2025-04-24 06:45:06'
            ],
            [
                'name' => 'Ukraine',
                'alpha_2_code' => 'UA',
                'alpha_3_code' => 'UKR',
                'numeric_code' => 804,
                'svg_icon' => 'ua.svg',
                'created_at' => '2025-04-24 06:45:06',
                'updated_at' => '2025-04-24 06:45:06'
            ],
            [
                'name' => 'United Arab Emirates (the)',
                'alpha_2_code' => 'AE',
                'alpha_3_code' => 'ARE',
                'numeric_code' => 784,
                'svg_icon' => 'ae.svg',
                'created_at' => '2025-04-24 06:45:06',
                'updated_at' => '2025-04-24 06:45:06'
            ],
            [
                'name' => 'United Kingdom of Great Britain and Northern Ireland (the)',
                'alpha_2_code' => 'GB',
                'alpha_3_code' => 'GBR',
                'numeric_code' => 826,
                'svg_icon' => 'gb.svg',
                'created_at' => '2025-04-24 06:45:06',
                'updated_at' => '2025-04-24 06:45:06'
            ],
            [
                'name' => 'United States of America (the)',
                'alpha_2_code' => 'US',
                'alpha_3_code' => 'USA',
                'numeric_code' => 840,
                'svg_icon' => 'us.svg',
                'created_at' => '2025-04-24 06:45:06',
                'updated_at' => '2025-04-24 06:45:06'
            ],
            [
                'name' => 'Uruguay',
                'alpha_2_code' => 'UY',
                'alpha_3_code' => 'URY',
                'numeric_code' => 858,
                'svg_icon' => 'uy.svg',
                'created_at' => '2025-04-24 06:45:06',
                'updated_at' => '2025-04-24 06:45:06'
            ],
            [
                'name' => 'Uzbekistan',
                'alpha_2_code' => 'UZ',
                'alpha_3_code' => 'UZB',
                'numeric_code' => 860,
                'svg_icon' => 'uz.svg',
                'created_at' => '2025-04-24 06:45:06',
                'updated_at' => '2025-04-24 06:45:06'
            ],
            [
                'name' => 'Vanuatu',
                'alpha_2_code' => 'VU',
                'alpha_3_code' => 'VUT',
                'numeric_code' => 548,
                'svg_icon' => 'vu.svg',
                'created_at' => '2025-04-24 06:45:06',
                'updated_at' => '2025-04-24 06:45:06'
            ],
            [
                'name' => 'Venezuela (Bolivarian Republic of)',
                'alpha_2_code' => 'VE',
                'alpha_3_code' => 'VEN',
                'numeric_code' => 862,
                'svg_icon' => 've.svg',
                'created_at' => '2025-04-24 06:45:06',
                'updated_at' => '2025-04-24 06:45:06'
            ],
            [
                'name' => 'Vietnam',
                'alpha_2_code' => 'VN',
                'alpha_3_code' => 'VNM',
                'numeric_code' => 704,
                'svg_icon' => 'vn.svg',
                'created_at' => '2025-04-24 06:45:06',
                'updated_at' => '2025-04-24 06:45:06'
            ],
            [
                'name' => 'Western Sahara',
                'alpha_2_code' => 'EH',
                'alpha_3_code' => 'ESH',
                'numeric_code' => 732,
                'svg_icon' => 'eh.svg',
                'created_at' => '2025-04-24 06:45:06',
                'updated_at' => '2025-04-24 06:45:06'
            ],
            [
                'name' => 'Yemen',
                'alpha_2_code' => 'YE',
                'alpha_3_code' => 'YEM',
                'numeric_code' => 887,
                'svg_icon' => 'ye.svg',
                'created_at' => '2025-04-24 06:45:06',
                'updated_at' => '2025-04-24 06:45:06'
            ],
            [
                'name' => 'Zambia',
                'alpha_2_code' => 'ZM',
                'alpha_3_code' => 'ZMB',
                'numeric_code' => 894,
                'svg_icon' => 'zm.svg',
                'created_at' => '2025-04-24 06:45:06',
                'updated_at' => '2025-04-24 06:45:06'
            ],
            [
                'name' => 'Zimbabwe',
                'alpha_2_code' => 'ZW',
                'alpha_3_code' => 'ZWE',
                'numeric_code' => 716,
                'svg_icon' => 'zw.svg',
                'created_at' => '2025-04-24 06:45:06',
                'updated_at' => '2025-04-24 06:45:06'
            ]
        ]; // Removed extra semicolon here

        DB::table('countries')->insert($countries);
    }
}
