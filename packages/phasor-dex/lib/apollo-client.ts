"use client";

import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

const SUBGRAPH_URL =
  process.env.NEXT_PUBLIC_SUBGRAPH_URL ||
  "http://localhost:8000/subgraphs/name/phasor-v2";

const TOKENS_SUBGRAPH_URL =
  process.env.NEXT_PUBLIC_TOKENS_SUBGRAPH_URL ||
  "http://localhost:8000/subgraphs/name/v2-tokens";

const createHttpLink = (uri: string) =>
  new HttpLink({
    uri,
    fetch: (uri, options) => {
      return fetch(uri, options).catch((error) => {
        console.debug("Subgraph fetch error:", error);
        return new Response(JSON.stringify({ data: null, errors: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      });
    },
  });

const httpLink = createHttpLink(SUBGRAPH_URL);
const tokensHttpLink = createHttpLink(TOKENS_SUBGRAPH_URL);

// Main subgraph client for DEX data (pairs, swaps, mints, burns)
export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache({
    typePolicies: {
      Token: {
        keyFields: ["id"],
      },
      Pair: {
        keyFields: ["id"],
      },
      Query: {
        fields: {
          pairs: {
            keyArgs: false,
            merge(existing = [], incoming) {
              return [...existing, ...incoming];
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "cache-and-network",
      errorPolicy: "all",
    },
    query: {
      fetchPolicy: "cache-first",
      errorPolicy: "all",
    },
  },
});

// Tokens subgraph client for price data (tokenDayData, tokenHourData)
export const tokensApolloClient = new ApolloClient({
  link: tokensHttpLink,
  cache: new InMemoryCache({
    typePolicies: {
      Token: {
        keyFields: ["id"],
      },
      TokenDayData: {
        keyFields: ["id"],
      },
      TokenHourData: {
        keyFields: ["id"],
      },
      Bundle: {
        keyFields: ["id"],
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "cache-first",
      errorPolicy: "all",
    },
    query: {
      fetchPolicy: "cache-first",
      errorPolicy: "all",
    },
  },
});
