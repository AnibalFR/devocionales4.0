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
      apellidos
      rol
      comunidad {
        id
        nombre
      }
    }
  }
`;

export const ME_DETAILED_QUERY = gql`
  query MeDetailed {
    me {
      id
      email
      nombre
      apellidos
      rol
      comunidad {
        id
        nombre
      }
    }
    miembros {
      id
      usuarioId
      nucleoId
      barrioId
      nucleo {
        id
        nombre
        barrio {
          id
          nombre
        }
      }
    }
  }
`;
