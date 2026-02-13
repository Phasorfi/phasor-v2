"use client";

import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

// Envio uses Hasura as GraphQL backend
const ENVIO_URL =
  process.env.NEXT_PUBLIC_ENVIO_URL ||
  "http://localhost:8080/v1/graphql";

// Hasura admin secret for local development
const ENVIO_ADMIN_SECRET =
  process.env.NEXT_PUBLIC_ENVIO_ADMIN_SECRET || "testing";

// Create HTTP link with error handling
const httpLink = new HttpLink({
  uri: ENVIO_URL,
  fetch: (uri, options) => {
    return fetch(uri, options).catch((error) => {
      if (process.env.NODE_ENV === "development") {
        console.debug("Envio fetch error:", error);
      }
      return new Response(JSON.stringify({ data: null, errors: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
  },
});

// Add Hasura auth header
const authLink = setContext((_, { headers }) => ({
  headers: {
    ...headers,
    "x-hasura-admin-secret": ENVIO_ADMIN_SECRET,
  },
}));

// Main Envio client for DEX data (pairs, swaps, mints, burns)
export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
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
          Pair: {
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

/**
 * @deprecated Use apolloClient instead.
 * Envio indexes all data in a single database.
 */
export const tokensApolloClient = apolloClient;
