import { useNavigate } from 'react-router-dom';

const AdminSidebar = () => {
    const navigate = useNavigate();

    return (
        <div className="sidebar">
            {/* Other sidebar buttons */}
            <button onClick={() => navigate('/generate-question')}>Generate Ques</button>
        </div>
    );
};

export default AdminSidebar;
