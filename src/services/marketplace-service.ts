import { cachedGet, invalidateCache, request } from '@/src/services/http';
import type { MarketplaceConnection } from '@/src/types';

export const marketplaceService={
 list:(force=false)=>cachedGet<{connections:MarketplaceConnection[]}>('marketplaces','/api/seller/marketplaces',{force,maxAgeMs:2*60_000}),
 async connect(marketplace:string){const result=await request<{success?:boolean;status?:string}>('/api/seller/marketplaces',{method:'POST',body:JSON.stringify({marketplace,action:'connect'})});await invalidateCache('marketplaces');return result;},
 async disconnect(marketplace:string){const result=await request<{success:true;status:string}>('/api/seller/marketplaces',{method:'POST',body:JSON.stringify({marketplace,action:'disconnect'})});await invalidateCache('marketplaces');return result;},
};
