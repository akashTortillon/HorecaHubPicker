import api from "../axiosConfig";


export interface LoginPayload {
  username: string; // This will be your Employee ID
  password: string; // This will be your PIN
}

export const loginUser = async (payload: LoginPayload) => {
  try {
    console.log('🚀 [Login API] Attempting login for:', payload.username);

    const response = await api.post('picker/auth/login/', payload);

    // Path: results -> data -> { access, user }
    const { access, user } = response.data.results.data;

    console.log('✅ [Login API] Success for:', user.full_name);

    return {
      user: user as any,
      token: access as string,
    };
  } catch (error: any) {
    console.error(
      '❌ [Login API] Error:',
      error.response?.data || error.message,
    );
    throw error;
  }
};