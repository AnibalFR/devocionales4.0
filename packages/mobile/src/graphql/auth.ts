import { gql } from '@apollo/client';

export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        id
        email
        nombre
        rol
      }
    }
  }
`;

export const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      nombre
      rol
    }
  }
`;
