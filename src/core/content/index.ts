// The validated game content, compiled from content/*.yaml by `npm run content:build`.
import raw from '../../generated/content.json';
import { ContentSchema, type Content } from './schema';

export const CONTENT: Content = ContentSchema.parse(raw);

export const RULEBOOK = CONTENT.rules;
