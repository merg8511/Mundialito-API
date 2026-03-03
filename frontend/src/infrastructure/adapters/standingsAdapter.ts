import { httpClient } from "@/infrastructure/http/client";
import type { IStandingsPort } from "@/application/ports";
import type { Standing } from "@/domain/entities";
import type { PagedResponse } from "@/domain/types/pagination";

export const standingsAdapter: IStandingsPort = {
  async list(): Promise<PagedResponse<Standing>> {
    // 1. Hacemos la petición pero la guardamos en una variable
    const response = await httpClient.get<any>("standings");

    // 2. Imprimimos el resultado crudo en la consola
    console.log("⚽ RAW STANDINGS DEL API:", JSON.stringify(response, null, 2));

    // 3. Retornamos la data para que la UI intente usarla
    return response as PagedResponse<Standing>;
  },
};