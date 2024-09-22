import { ApolloClient, InMemoryCache } from "@apollo/client";

export const client = new ApolloClient({
    uri: 'https://test-api.production.tsportcambodia.com/graphql',
    cache: new InMemoryCache(),
});