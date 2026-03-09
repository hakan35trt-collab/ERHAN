import { localAuth, createEntity } from '@/lib/localStore';

export const User = localAuth;
export const Query = createEntity('queries');
