
export interface ImgbbResponse {
  data: {
    url: string;
    thumb: { url: string; };
    medium: { url: string; };
    delete_url: string;
  };
  success: boolean;
  status: number;
}
