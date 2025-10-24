import { gql } from '@apollo/client';

export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        id
        email
        nombre
        apellidos
        rol
        mustChangePassword
        comunidad {
          id
          nombre
          descripcion
          activa
        }
      }
    }
  }
`;
