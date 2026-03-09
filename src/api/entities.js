import { githubAuth } from '@/lib/githubStore';
import { createGitHubEntity } from '@/lib/githubStore';

export const User = githubAuth;
export const Query = createGitHubEntity('queries');
