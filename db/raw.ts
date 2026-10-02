import {env} from 'cloudflare:workers';
export function rawDb():D1Database{if(!env.DB)throw Error('저장 서비스를 사용할 수 없습니다');return env.DB as D1Database;}
