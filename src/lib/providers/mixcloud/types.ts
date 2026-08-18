/** Raw shapes returned by https://api.mixcloud.com — never leave the data layer. */

export interface MixcloudPictures {
  readonly small?: string;
  readonly thumbnail?: string;
  readonly medium?: string;
  readonly medium_mobile?: string;
  readonly large?: string;
  readonly extra_large?: string;
  readonly '320wx320h'?: string;
  readonly '640wx640h'?: string;
  readonly '768wx768h'?: string;
  readonly '1024wx1024h'?: string;
}

export interface MixcloudUser {
  readonly key?: string;
  readonly url?: string;
  readonly name?: string;
  readonly username?: string;
}

export interface MixcloudTag {
  readonly key?: string;
  readonly name?: string;
  readonly url?: string;
}

export interface MixcloudCloudcast {
  readonly key?: string;
  readonly slug?: string;
  readonly name?: string;
  readonly url?: string;
  readonly created_time?: string;
  readonly updated_time?: string;
  readonly play_count?: number;
  readonly favorite_count?: number;
  readonly listener_count?: number;
  readonly audio_length?: number;
  readonly pictures?: MixcloudPictures;
  readonly user?: MixcloudUser;
  readonly tags?: readonly MixcloudTag[];
}

export interface MixcloudPaging {
  readonly next?: string;
  readonly previous?: string;
}

export interface MixcloudSearchResponse {
  readonly data?: readonly MixcloudCloudcast[];
  readonly paging?: MixcloudPaging;
}
