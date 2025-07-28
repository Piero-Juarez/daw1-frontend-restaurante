import {HttpContextToken} from '@angular/common/http';

export const BYPASS_TOKEN_INTERCEPTOR = new HttpContextToken<boolean>(() => false);
