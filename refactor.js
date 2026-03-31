const fs = require('fs');
const file = 'd:/code/recruitment_ai_frontend/src/views/RegisterView.vue';
let content = fs.readFileSync(file, 'utf8');

const replacement = `      <form @submit.prevent="handleRegister" class="form">
        <div class="field">
          <label for="username">用户名</label>
          <div class="input-with-icon">
            <span class="icon">👤</span>
            <input id="username" type="text" v-model="form.username" placeholder="请输入用户名" required />
          </div>
        </div>

        <div class="field">
          <label for="email">邮箱或手机号</label>
          <div class="input-with-icon">
            <span class="icon">@</span>
            <input id="email" type="text" v-model="form.email" placeholder="请输入邮箱或手机号" required />
          </div>
        </div>

        <div class="field">
          <label for="password">密码</label>
          <div class="input-with-icon">
            <span class="icon">🔒</span>
            <input :type="showPassword ? 'text' : 'password'" id="password" v-model="form.password" placeholder="请输入密码" required />
            <button type="button" class="eye" @click="showPassword = !showPassword">{{ showPassword ? '🙈' : '👁️' }}</button>
          </div>
          <div v-if="form.password" class="pw-hint">
            <div :class="['dot', form.password.length >= 8 ? 'ok' : '']"></div><small> 至少 8 个字符</small>
            <div :class="['dot', /\\\\d/.test(form.password) ? 'ok' : '']"></div><small> 包含数字</small>
            <div :class="['dot', /[a-zA-Z]/.test(form.password) ? 'ok' : '']"></div><small> 包含字母</small>
          </div>
        </div>

        <div class="field">
          <label for="confirmPassword">确认密码</label>
          <div class="input-with-icon">
            <span class="icon">🔒</span>
            <input :type="showConfirm ? 'text' : 'password'" id="confirmPassword" v-model="form.confirmPassword" placeholder="请再次输入密码" required />
            <button type="button" class="eye" @click="showConfirm = !showConfirm">{{ showConfirm ? '🙈' : '👁️' }}</button>
          </div>
          <p v-if="form.confirmPassword && form.confirmPassword !== form.password" class="error">两次密码输入不一致</p>
        </div>

        <div class="terms">
          <input type="checkbox" id="agree" v-model="agree" />
          <label for="agree">我已阅读并同意 <a href="javascript:void(0)" class="link">用户协议</a> 和 <a href="javascript:void(0)" class="link">隐私政策</a></label>
        </div>

        <button type="submit" class="submit-btn" :disabled="!canSubmit" :class="{ 'is-disabled': !canSubmit }">立即注册</button>

        <div class="register-row">已有账号？ <a href="/login" class="link">立即登录</a></div>

        <div class="divider-hr"><span>或使用以下方式登录</span></div>
        <SocialButtons />
      </form>`;

const regex = /<el-form class="form" label-position="top">([\s\S]*?)<\/el-form>/;
content = content.replace(regex, replacement);

fs.writeFileSync(file, content, 'utf8');
console.log('Update successful');
