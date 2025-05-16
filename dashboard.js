import { checkAuth, checkRoles } from '../utils/auth';
import { fetchUserData } from '../utils/api';

export default function Dashboard() {
    return `
        <div class="dashboard-container">
            <h1>Dashboard</h1>
            <div class="tabs">
                <div class="tab active" data-tab="overview">Overview</div>
                <div class="tab" data-tab="scripts">My Scripts</div>
                <div class="tab" data-tab="keys">Keys</div>
                ${await checkRoles(['Staff']) ? '<div class="tab" data-tab="admin">Admin</div>' : ''}
            </div>
            
            <div class="tab-content active" id="overview">
                <div class="card">
                    <h2 class="card-title">Welcome Back</h2>
                    <p>Your current subscription status: <strong>Premium</strong></p>
                </div>
            </div>
            
            <div class="tab-content" id="scripts">
                <div class="card">
                    <h2 class="card-title">Your Scripts</h2>
                    <p>No scripts saved yet.</p>
                </div>
            </div>
            
            <div class="tab-content" id="keys">
                <div class="card">
                    <h2 class="card-title">Your Keys</h2>
                    <p>No active keys.</p>
                </div>
            </div>
            
            ${await checkRoles(['Staff']) ? `
            <div class="tab-content" id="admin">
                <div class="card">
                    <h2 class="card-title">Admin Panel</h2>
                    <div class="table-responsive">
                        <table class="user-table">
                            <thead>
                                <tr>
                                    <th>Username</th>
                                    <th>Discord ID</th>
                                    <th>Roles</th>
                                    <th>Last Active</th>
                                </tr>
                            </thead>
                            <tbody id="usersTableBody">
                                <!-- Users will be loaded here -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            ` : ''}
        </div>
        
        <script src="/js/dashboard.js"></script>
    `;
}
