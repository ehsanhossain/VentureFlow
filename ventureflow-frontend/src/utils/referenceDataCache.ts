/**
 * Reference Data Cache — In-memory cache with request deduplication.
 *
 * This module caches static/semi-static reference data (countries, currencies,
 * industries, pipeline stages) so that navigating between pages doesn't trigger
 * redundant API calls. Each cache entry has a 5-minute TTL, and concurrent
 * requests for the same key are deduplicated (only 1 API call fires).
 */
import api from '../config/api';

// ─── Types ───────────────────────────────────────────────────────────

export interface CachedCountry {
    id: number;
    name: string;
    alpha_2_code?: string;
    alpha_3_code?: string;
    numeric_code?: number;
    svg_icon_url?: string;
    flagSrc?: string;
    status?: string;
}

export interface CachedCurrency {
    id: number;
    currency_code: string;
    currency_name?: string;
    currency_sign?: string;
    exchange_rate?: string;
    country?: string;
    dollar_unit?: string;
    source?: string;
}

export interface CachedIndustry {
    id: number;
    name: string;
    status?: boolean | string;
    sub_industries?: { id: number; name: string }[];
}

export interface CachedPipelineStage {
    id: number;
    code: string;
    name: string;
    type?: string;
}

// ─── Cache internals ─────────────────────────────────────────────────

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const cache = new Map<string, CacheEntry<any>>();
const inflight = new Map<string, Promise<any>>();

function isFresh(key: string): boolean {
    const entry = cache.get(key);
    if (!entry) return false;
    return Date.now() - entry.timestamp < CACHE_TTL;
}

/**
 * Generic cached fetcher with request deduplication.
 * If data is in cache and fresh, returns immediately.
 * If a request for the same key is already in-flight, piggybacks on it.
 * Otherwise, fires a new API request, caches the result, and returns.
 */
async function getCached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    // Return cached data if fresh
    const entry = cache.get(key);
    if (entry && isFresh(key)) {
        return entry.data;
    }

    // Deduplicate in-flight requests
    const existing = inflight.get(key);
    if (existing) {
        return existing;
    }

    // Fire new request
    const promise = fetcher()
        .then((data) => {
            cache.set(key, { data, timestamp: Date.now() });
            inflight.delete(key);
            return data;
        })
        .catch((err) => {
            inflight.delete(key);
            // If we have stale data, return it on error
            const stale = cache.get(key);
            if (stale) return stale.data;
            throw err;
        });

    inflight.set(key, promise);
    return promise;
}

// ─── Public API ──────────────────────────────────────────────────────

export async function getCachedCountries(): Promise<CachedCountry[]> {
    return getCached('countries', async () => {
        const res = await api.get('/api/countries');
        const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        return data.map((c: any) => ({
            id: c.id,
            name: c.name,
            alpha_2_code: c.alpha_2_code,
            alpha_3_code: c.alpha_3_code,
            numeric_code: c.numeric_code,
            svg_icon_url: c.svg_icon_url,
            flagSrc: c.svg_icon_url,
            status: c.status || 'registered',
        }));
    });
}

export async function getCachedCurrencies(): Promise<CachedCurrency[]> {
    return getCached('currencies', async () => {
        const res = await api.get('/api/currencies', { params: { per_page: 1000 } });
        const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        return data;
    });
}

export async function getCachedIndustries(): Promise<CachedIndustry[]> {
    return getCached('industries', async () => {
        const res = await api.get('/api/industries');
        const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        return data.map((i: any) => ({
            id: i.id,
            name: i.name,
            status: i.status,
            sub_industries: i.sub_industries || [],
        }));
    });
}

export async function getCachedPipelineStages(): Promise<CachedPipelineStage[]> {
    return getCached('pipeline_stages', async () => {
        const res = await api.get('/api/pipeline-stages');
        const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        return data.map((s: any) => ({
            id: s.id,
            code: s.code || s.stage_code || '',
            name: s.name || s.stage_name || '',
            type: s.pipeline_type || s.type || '',
        }));
    });
}

/**
 * Invalidate one or all cache entries.
 * Call this after CRUD operations that modify cached data.
 */
export function invalidateCache(key?: string): void {
    if (key) {
        cache.delete(key);
        inflight.delete(key);
    } else {
        cache.clear();
        inflight.clear();
    }
}
