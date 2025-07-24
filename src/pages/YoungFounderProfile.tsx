/**
 * @fileoverview Young Founder Dashboard/Profile Page
 * 
 * Comprehensive dashboard for young founders (18-27) providing:
 * - Profile management and editing
 * - Program applications and status tracking
 * - Badges and certificates display
 * - Mentorship management (if applicable)
 * - Statistics and analytics
 * - Notifications center
 * 
 * Features responsive design with sidebar navigation and tabbed content areas.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Home, 
  Award, 
  Users, 
  TrendingUp, 
  Bell, 
  Settings,
  BookOpen,
  Briefcase,
  Star,
  Calendar,
  Download,
  ExternalLink,
  Edit,
  Save,
  X
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

// Types for dashboard data
interface UserProfile {
  individual_id: string;
  first_name: string;
  last_name: string;
  email: string;
  mobile?: string;
  country_code?: string;
  country_iso_code?: string;
  city?: string;
  country?: string;
  dob?: string;
  instagram?: string;
  linkedin?: string;
  bio?: string;
  profile_photo_url?: string;
  interests?: string[];
  university?: string;
  graduation_year?: number;
  current_company?: string;
  job_title?: string;
  is_mentor: boolean;
  email_verified: boolean;
  phone_verified: boolean;
}

interface DashboardStats {
  events_attended: number;
  applications_made: number;
  chapters_joined: number;
  certificates_earned: number;
  mentorships_active: number;
}

const YoungFounderProfile: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State management
  const [activeSection, setActiveSection] = useState('overview');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});
  const [loading, setLoading] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
      return;
    }
  }, [user, authLoading, navigate]);

  // Fetch user profile and dashboard data
  useEffect(() => {
    if (user?.email) {
      fetchUserProfile();
      fetchDashboardStats();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('individuals')
        .select('*')
        .eq('email', user?.email)
        .single();

      if (error) throw error;
      
      setUserProfile(data);
      setEditedProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    if (!userProfile) return;

    try {
      // Fetch various stats in parallel
      const [eventsResult, applicationsResult, chaptersResult, certificatesResult, mentorshipsResult] = await Promise.all([
        supabase.from('event_participation').select('event_id').eq('individual_id', userProfile.individual_id),
        supabase.from('yff_applications').select('application_id').eq('individual_id', userProfile.individual_id),
        supabase.from('chapter_members').select('chapter_id').eq('individual_id', userProfile.individual_id),
        supabase.from('certificates').select('certificate_id').eq('individual_id', userProfile.individual_id),
        supabase.from('mentorships').select('mentorship_id').or(`mentor_id.eq.${userProfile.individual_id},mentee_id.eq.${userProfile.individual_id}`)
      ]);

      setDashboardStats({
        events_attended: eventsResult.data?.length || 0,
        applications_made: applicationsResult.data?.length || 0,
        chapters_joined: chaptersResult.data?.length || 0,
        certificates_earned: certificatesResult.data?.length || 0,
        mentorships_active: mentorshipsResult.data?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const { error } = await supabase
        .from('individuals')
        .update(editedProfile)
        .eq('individual_id', userProfile?.individual_id);

      if (error) throw error;

      setUserProfile({ ...userProfile!, ...editedProfile });
      setIsEditing(false);
      
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditedProfile(userProfile || {});
    setIsEditing(false);
  };

  // Navigation items for sidebar
  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'programs', label: 'My Programs', icon: BookOpen },
    { id: 'applications', label: 'Applications', icon: Briefcase },
    { id: 'badges', label: 'Badges & Certificates', icon: Award },
    ...(userProfile?.is_mentor ? [{ id: 'mentorship', label: 'Mentorship', icon: Users }] : []),
    { id: 'stats', label: 'Stats', icon: TrendingUp },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive">Profile Not Found</h2>
          <p className="text-muted-foreground mt-2">Unable to load your profile data.</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <header className="border-b bg-card">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="flex items-center space-x-2"
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <h1 className="text-2xl font-bold">Young Founder Dashboard</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarImage src={userProfile.profile_photo_url} />
              <AvatarFallback>
                {userProfile.first_name?.[0]}{userProfile.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <p className="font-medium">{userProfile.first_name} {userProfile.last_name}</p>
              <p className="text-muted-foreground">{userProfile.email}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-card border-r min-h-[calc(100vh-73px)]">
          <nav className="p-4">
            <ul className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        activeSection === item.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6">
          {/* Overview Section */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold">Welcome back, {userProfile.first_name}!</h2>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Events Attended</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardStats?.events_attended || 0}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Applications</CardTitle>
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardStats?.applications_made || 0}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Certificates</CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardStats?.certificates_earned || 0}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Mentorships</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardStats?.mentorships_active || 0}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Access Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveSection('programs')}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BookOpen className="h-5 w-5" />
                      <span>My Programs</span>
                    </CardTitle>
                    <CardDescription>View and manage your enrolled programs</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">View Programs</Button>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveSection('badges')}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Award className="h-5 w-5" />
                      <span>Achievements</span>
                    </CardTitle>
                    <CardDescription>Your badges and certificates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">View Achievements</Button>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveSection('applications')}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Briefcase className="h-5 w-5" />
                      <span>Applications</span>
                    </CardTitle>
                    <CardDescription>Apply to new programs</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">New Application</Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Profile Section */}
          {activeSection === 'profile' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold">My Profile</h2>
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex space-x-2">
                    <Button onClick={handleSaveProfile}>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button variant="outline" onClick={handleCancelEdit}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Picture Section */}
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle>Profile Picture</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center space-y-4">
                    <Avatar className="h-32 w-32">
                      <AvatarImage src={userProfile.profile_photo_url} />
                      <AvatarFallback className="text-2xl">
                        {userProfile.first_name?.[0]}{userProfile.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    {isEditing && (
                      <Button variant="outline" size="sm">
                        Upload New Photo
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Profile Information */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="first_name">First Name</Label>
                        {isEditing ? (
                          <Input
                            id="first_name"
                            value={editedProfile.first_name || ''}
                            onChange={(e) => setEditedProfile({ ...editedProfile, first_name: e.target.value })}
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground mt-1">{userProfile.first_name}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="last_name">Last Name</Label>
                        {isEditing ? (
                          <Input
                            id="last_name"
                            value={editedProfile.last_name || ''}
                            onChange={(e) => setEditedProfile({ ...editedProfile, last_name: e.target.value })}
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground mt-1">{userProfile.last_name}</p>
                        )}
                      </div>

                      <div>
                        <Label>Email</Label>
                        <div className="flex items-center space-x-2">
                          <p className="text-sm text-muted-foreground">{userProfile.email}</p>
                          {userProfile.email_verified && (
                            <Badge variant="secondary" className="text-xs">Verified</Badge>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label>Date of Birth</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {userProfile.dob ? new Date(userProfile.dob).toLocaleDateString() : 'Not provided'}
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="mobile">Mobile</Label>
                        {isEditing ? (
                          <div className="flex space-x-2">
                            <Input
                              value={editedProfile.country_code || '+91'}
                              onChange={(e) => setEditedProfile({ ...editedProfile, country_code: e.target.value })}
                              className="w-20"
                            />
                            <Input
                              id="mobile"
                              value={editedProfile.mobile || ''}
                              onChange={(e) => setEditedProfile({ ...editedProfile, mobile: e.target.value })}
                              className="flex-1"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <p className="text-sm text-muted-foreground mt-1">
                              {userProfile.country_code} {userProfile.mobile}
                            </p>
                            {userProfile.phone_verified && (
                              <Badge variant="secondary" className="text-xs">Verified</Badge>
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="city">City</Label>
                        {isEditing ? (
                          <Input
                            id="city"
                            value={editedProfile.city || ''}
                            onChange={(e) => setEditedProfile({ ...editedProfile, city: e.target.value })}
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground mt-1">{userProfile.city || 'Not provided'}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="country">Country</Label>
                        {isEditing ? (
                          <Input
                            id="country"
                            value={editedProfile.country || ''}
                            onChange={(e) => setEditedProfile({ ...editedProfile, country: e.target.value })}
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground mt-1">{userProfile.country || 'Not provided'}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="university">University</Label>
                        {isEditing ? (
                          <Input
                            id="university"
                            value={editedProfile.university || ''}
                            onChange={(e) => setEditedProfile({ ...editedProfile, university: e.target.value })}
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground mt-1">{userProfile.university || 'Not provided'}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="instagram">Instagram</Label>
                        {isEditing ? (
                          <Input
                            id="instagram"
                            value={editedProfile.instagram || ''}
                            onChange={(e) => setEditedProfile({ ...editedProfile, instagram: e.target.value })}
                            placeholder="@username"
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground mt-1">{userProfile.instagram || 'Not provided'}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="linkedin">LinkedIn</Label>
                        {isEditing ? (
                          <Input
                            id="linkedin"
                            value={editedProfile.linkedin || ''}
                            onChange={(e) => setEditedProfile({ ...editedProfile, linkedin: e.target.value })}
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground mt-1">{userProfile.linkedin || 'Not provided'}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      {isEditing ? (
                        <Textarea
                          id="bio"
                          value={editedProfile.bio || ''}
                          onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                          placeholder="Tell us about yourself..."
                          rows={3}
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground mt-1">{userProfile.bio || 'No bio provided'}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Applications Section */}
          {activeSection === 'applications' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold">Apply to Programs</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle>Young Founders Program</CardTitle>
                    <CardDescription>Join our flagship entrepreneurship program</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" onClick={() => navigate('/yff')}>
                      Apply Now
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle>Young Founders Floor</CardTitle>
                    <CardDescription>Access our co-working and networking space</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" onClick={() => navigate('/yff/apply')}>
                      Apply Now
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle>Campus Ambassador</CardTitle>
                    <CardDescription>Represent 26ideas at your university</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full">
                      Apply Now
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle>Mentor Program</CardTitle>
                    <CardDescription>Share your expertise with fellow founders</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" onClick={() => navigate('/mentor-signup')}>
                      Apply Now
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle>Young Founders League</CardTitle>
                    <CardDescription>Join our competitive startup program</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" disabled>
                      Coming Soon
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Badges & Certificates Section */}
          {activeSection === 'badges' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold">Badges & Certificates</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Placeholder for when no certificates exist */}
                <Card className="col-span-full text-center py-12">
                  <CardContent>
                    <Award className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No certificates yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Complete programs and courses to earn certificates and badges
                    </p>
                    <Button onClick={() => setActiveSection('applications')}>
                      Explore Programs
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Stats Section */}
          {activeSection === 'stats' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold">Your Statistics</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Activity Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>Events Attended</span>
                        <span>{dashboardStats?.events_attended || 0}</span>
                      </div>
                      <Progress value={(dashboardStats?.events_attended || 0) * 10} />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>Applications Submitted</span>
                        <span>{dashboardStats?.applications_made || 0}</span>
                      </div>
                      <Progress value={(dashboardStats?.applications_made || 0) * 20} />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>Certificates Earned</span>
                        <span>{dashboardStats?.certificates_earned || 0}</span>
                      </div>
                      <Progress value={(dashboardStats?.certificates_earned || 0) * 25} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Milestones</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="text-sm">Profile Created</span>
                      </div>
                      {dashboardStats?.events_attended && dashboardStats.events_attended > 0 && (
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span className="text-sm">First Event Attended</span>
                        </div>
                      )}
                      {dashboardStats?.applications_made && dashboardStats.applications_made > 0 && (
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span className="text-sm">First Application Submitted</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Mentorship Section (only visible for mentors) */}
          {activeSection === 'mentorship' && userProfile.is_mentor && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold">Mentorship Dashboard</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Active Mentorships</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{dashboardStats?.mentorships_active || 0}</p>
                    <p className="text-muted-foreground text-sm">Currently mentoring</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Sessions This Month</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">0</p>
                    <p className="text-muted-foreground text-sm">Mentorship sessions</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Average Rating</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      <p className="text-3xl font-bold">-</p>
                      <Star className="h-6 w-6 text-yellow-500" />
                    </div>
                    <p className="text-muted-foreground text-sm">No ratings yet</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Notifications Section */}
          {activeSection === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold">Notifications</h2>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No notifications</h3>
                  <p className="text-muted-foreground">
                    You're all caught up! Check back later for updates.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default YoungFounderProfile;