import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated on app start
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      const isAuth = localStorage.getItem('isAuthenticated') === 'true';
      
      if (token && isAuth) {
        // In a real app, you would validate the token with your backend
        setUser({
          id: 1,
          fullName: 'Nguyễn Văn An',
          email: 'admin@example.com',
          role: 'admin'
        });
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      setIsLoading(true);
      
      // Mock login - replace with actual API call
      if (credentials.email === 'admin@example.com' && credentials.password === 'password') {
        const userData = {
          id: 1,
          fullName: 'Nguyễn Văn An',
          email: credentials.email,
          role: 'admin'
        };
        
        // Store auth state
        localStorage.setItem('authToken', 'mock-jwt-token');
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify(userData));
        
        setUser(userData);
        
        return { success: true };
      } else {
        return { success: false, error: 'Email hoặc mật khẩu không chính xác' };
      }
    } catch (error) {
      return { success: false, error: 'Có lỗi xảy ra khi đăng nhập' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Clear auth state
    localStorage.removeItem('authToken');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    
    setUser(null);
  };

  const signup = async (userData) => {
    try {
      setIsLoading(true);
      
      // Mock signup - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Có lỗi xảy ra khi đăng ký' };
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    try {
      setIsLoading(true);
      
      // Mock forgot password - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Có lỗi xảy ra khi gửi email' };
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (passwordData) => {
    try {
      setIsLoading(true);
      
      // Mock change password - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Có lỗi xảy ra khi thay đổi mật khẩu' };
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      setIsLoading(true);
      
      // Mock update profile - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update user state
      const updatedUser = { ...user, ...profileData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Có lỗi xảy ra khi cập nhật thông tin' };
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    signup,
    forgotPassword,
    changePassword,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};